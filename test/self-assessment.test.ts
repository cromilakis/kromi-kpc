import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ADJUSTMENT_FACTORS,
  DB_ESTIMATED_TIER,
  DB_RISK_FACTOR_TOKENS,
  estimate,
  REGULATED_SECTORS,
  RISK_FACTORS,
  SECTOR_CODES,
  SIZE_TIERS,
} from "../lib/self-assessment/estimate";
import { leadSubmissionSchema } from "../lib/self-assessment/lead-schema";
// El módulo de scoring es `server-only`; en vitest el paquete se stubea vacío
// (alias en vitest.config.ts) — el guard real lo aplica el build de Next.
import {
  computeInternalScore,
  SECTOR_MULTIPLIERS,
} from "../lib/self-assessment/scoring.server";
import es from "../messages/es.json";

// El módulo admin se mockea para que la server action sea determinista en CI
// (sin red ni env). El guard real de admin.ts se prueba con importActual.
const adminMock = vi.hoisted(() => ({
  createAdminClient: vi.fn<() => unknown>(() => {
    throw new Error("Supabase admin no configurado (mock por defecto)");
  }),
}));
vi.mock("../lib/supabase/admin", () => adminMock);

import { submitSelfAssessment } from "../lib/actions/self-assessment";

const asRecord = (value: unknown) => value as Record<string, unknown>;

/** Fuente de un módulo del repo (para asserts de frontera cliente/servidor). */
const readSource = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8");

// ---------------------------------------------------------------------------
// estimate() — orientación pública (réplica del cotizador del prototipo)
// ---------------------------------------------------------------------------
describe("estimate — orientación pública", () => {
  it("micro sin factores → tramo micro, nota base, sin ajustes", () => {
    const result = estimate({ sizeTier: "micro", sectorCode: "startup", riskFactors: [] });
    expect(result.sizeTier).toBe("micro");
    expect(result.isEnterprise).toBe(false);
    expect(result.noteKey).toBe("base");
    expect(result.hasAdjustments).toBe(false);
    expect(result.adjustmentFactors).toEqual([]);
  });

  it("mediana/grande → Enterprise y nota enterprise aunque haya factores", () => {
    const result = estimate({
      sizeTier: "enterprise",
      sectorCode: "fintech",
      riskFactors: ["sensitive_data"],
    });
    expect(result.isEnterprise).toBe(true);
    expect(result.noteKey).toBe("enterprise");
    expect(result.hasAdjustments).toBe(true);
  });

  it("rubros regulados agregan el chip regulated_sector; el resto no", () => {
    for (const sectorCode of SECTOR_CODES) {
      const result = estimate({ sizeTier: "small", sectorCode, riskFactors: [] });
      const isRegulated = REGULATED_SECTORS.includes(sectorCode);
      expect(result.adjustmentFactors.includes("regulated_sector"), sectorCode).toBe(
        isRegulated,
      );
      expect(result.noteKey).toBe(isRegulated ? "withFactors" : "base");
    }
  });

  it("los chips salen en el orden estable del prototipo", () => {
    const result = estimate({
      sizeTier: "small",
      sectorCode: "salud",
      riskFactors: [
        "critical_providers",
        "multi_site",
        "automated_decisions",
        "international_transfers",
        "sensitive_data",
      ],
    });
    expect(result.adjustmentFactors).toEqual([...ADJUSTMENT_FACTORS]);
  });

  it("con ≥1 factor y tamaño no-enterprise la nota es withFactors", () => {
    const result = estimate({
      sizeTier: "micro",
      sectorCode: "retail",
      riskFactors: ["multi_site"],
    });
    expect(result.noteKey).toBe("withFactors");
    expect(result.adjustmentFactors).toEqual(["multi_site"]);
  });
});

// ---------------------------------------------------------------------------
// computeInternalScore() — Complexity Score interno (server-only, prototipo)
// ---------------------------------------------------------------------------
describe("computeInternalScore — score interno (nunca visible al prospecto)", () => {
  it("micro startup sin factores: round(8 × 1.1) = 9, tramo low", () => {
    const internal = computeInternalScore({
      sizeTier: "micro",
      sectorCode: "startup",
      riskFactors: [],
    });
    expect(internal.basePoints).toBe(8);
    expect(internal.multiplier).toBe(SECTOR_MULTIPLIERS.startup);
    expect(internal.score).toBe(9);
    expect(internal.scoreTier).toBe("low");
  });

  it("enterprise fintech con todos los factores: (20+12+7+9+5+6+9)×1.8 = 122, critical", () => {
    const internal = computeInternalScore({
      sizeTier: "enterprise",
      sectorCode: "fintech",
      riskFactors: [...RISK_FACTORS],
    });
    expect(internal.basePoints).toBe(68);
    expect(internal.score).toBe(122);
    expect(internal.scoreTier).toBe("critical");
  });

  it("el bono de volumen de sensibles aplica solo en enterprise", () => {
    const small = computeInternalScore({
      sizeTier: "small",
      sectorCode: "salud",
      riskFactors: ["sensitive_data"],
    });
    expect(small.basePoints).toBe(26); // 14 + 12, sin bono
    expect(small.score).toBe(44); // round(26 × 1.7)
    expect(small.scoreTier).toBe("low");

    const enterprise = computeInternalScore({
      sizeTier: "enterprise",
      sectorCode: "salud",
      riskFactors: ["sensitive_data"],
    });
    expect(enterprise.basePoints).toBe(41); // 20 + 12 + 9 (volumen)
    expect(enterprise.score).toBe(70); // round(41 × 1.7) — umbral high
    expect(enterprise.scoreTier).toBe("high");
  });

  it("umbral medium: small fintech + sensibles + IA → round(35×1.8)=63", () => {
    const internal = computeInternalScore({
      sizeTier: "small",
      sectorCode: "fintech",
      riskFactors: ["sensitive_data", "automated_decisions"],
    });
    expect(internal.score).toBe(63);
    expect(internal.scoreTier).toBe("medium");
  });

  it("los factores duplicados se cuentan una sola vez", () => {
    const internal = computeInternalScore({
      sizeTier: "micro",
      sectorCode: "b2b",
      riskFactors: ["multi_site", "multi_site", "multi_site"],
    });
    expect(internal.basePoints).toBe(13); // 8 + 5
  });
});

// ---------------------------------------------------------------------------
// Frontera cliente/servidor (D7): los pesos internos no viajan al cliente
// ---------------------------------------------------------------------------
describe("frontera server-only del scoring", () => {
  it("scoring.server.ts declara import 'server-only' al tope", () => {
    expect(readSource("../lib/self-assessment/scoring.server.ts")).toMatch(
      /^import ["']server-only["'];/,
    );
  });

  it("el wizard (cliente) no importa scoring.server ni conoce el score", () => {
    const wizard = readSource("../components/self-assessment/wizard.tsx");
    expect(wizard).not.toMatch(/scoring\.server/);
    expect(wizard).not.toMatch(/computeInternalScore/);
  });

  it("estimate() público no expone ningún score interno", () => {
    const result = estimate({
      sizeTier: "enterprise",
      sectorCode: "fintech",
      riskFactors: [...RISK_FACTORS],
    });
    expect(result).not.toHaveProperty("internal");
    expect(JSON.stringify(result)).not.toMatch(/score/i);
  });
});

// ---------------------------------------------------------------------------
// Contrato de persistencia (tokens de la migración operations.sql)
// ---------------------------------------------------------------------------
describe("contrato con self_assessments", () => {
  it("los tokens de risk_factors coinciden con los documentados en la migración", () => {
    expect(DB_RISK_FACTOR_TOKENS.sensitive_data).toBe("datos_sensibles");
    expect(DB_RISK_FACTOR_TOKENS.regulated_sector).toBe("rubro_regulado");
    expect(DB_RISK_FACTOR_TOKENS.international_transfers).toBe(
      "transferencias_internacionales",
    );
    expect(DB_RISK_FACTOR_TOKENS.automated_decisions).toBe("decisiones_automatizadas");
    for (const factor of ADJUSTMENT_FACTORS) {
      expect(DB_RISK_FACTOR_TOKENS[factor]).toMatch(/^[a-z_]+$/);
    }
  });

  it("estimated_tier guarda la orientación de valor, nunca el score", () => {
    expect(DB_ESTIMATED_TIER.micro).toBe("Desde 5 UF + IVA");
    expect(DB_ESTIMATED_TIER.small).toBe("Desde 15 UF + IVA");
    expect(DB_ESTIMATED_TIER.enterprise).toBe("Bajo cotización");
  });

  it("fuente única de precios: DB_ESTIMATED_TIER coincide con result.prices de es.json", () => {
    const prices = asRecord(
      asRecord(asRecord(asRecord(es).selfAssessment).result).prices,
    );
    for (const tier of SIZE_TIERS) {
      expect(DB_ESTIMATED_TIER[tier], `price ${tier}`).toBe(prices[tier]);
    }
  });
});

// ---------------------------------------------------------------------------
// Zod estricto (lead-schema)
// ---------------------------------------------------------------------------
describe("leadSubmissionSchema", () => {
  const base = {
    sizeTier: "micro",
    sectorCode: "retail",
    riskFactors: ["sensitive_data"],
  };

  it("acepta un payload válido con solo correo y normaliza (trim/lowercase)", () => {
    const parsed = leadSubmissionSchema.safeParse({
      ...base,
      contactEmail: "  Persona@Empresa.CL ",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.contactEmail).toBe("persona@empresa.cl");
  });

  it("acepta solo teléfono (formato chileno con espacios y +)", () => {
    const parsed = leadSubmissionSchema.safeParse({
      ...base,
      contactPhone: "+56 9 1234 5678",
    });
    expect(parsed.success).toBe(true);
  });

  it("rechaza cuando no hay ni correo ni teléfono (nombre solo no es contactable)", () => {
    const parsed = leadSubmissionSchema.safeParse({ ...base, contactName: "Ana" });
    expect(parsed.success).toBe(false);
  });

  it("rechaza claves extra (strict), email inválido, teléfono sin dígitos y enums fuera de rango", () => {
    expect(
      leadSubmissionSchema.safeParse({ ...base, contactEmail: "a@b.cl", extra: 1 }).success,
    ).toBe(false);
    expect(
      leadSubmissionSchema.safeParse({ ...base, contactEmail: "no-es-email" }).success,
    ).toBe(false);
    expect(
      leadSubmissionSchema.safeParse({ ...base, contactPhone: "---- ----" }).success,
    ).toBe(false);
    expect(
      leadSubmissionSchema.safeParse({
        ...base,
        sectorCode: "otro",
        contactEmail: "a@b.cl",
      }).success,
    ).toBe(false);
    expect(
      leadSubmissionSchema.safeParse({
        ...base,
        riskFactors: ["invalid_factor"],
        contactEmail: "a@b.cl",
      }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Server action — validación y degradación con gracia
// ---------------------------------------------------------------------------
describe("submitSelfAssessment", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    adminMock.createAdminClient.mockReset();
    adminMock.createAdminClient.mockImplementation(() => {
      throw new Error("Supabase admin no configurado (mock)");
    });
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("payload inválido → { ok:false, error:'validation' } sin tocar Supabase", async () => {
    const result = await submitSelfAssessment({ nope: true });
    expect(result).toEqual({ ok: false, error: "validation" });
    expect(adminMock.createAdminClient).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });

  it("sin env de Supabase → degrada a 'unavailable' y loggea", async () => {
    const result = await submitSelfAssessment({
      sizeTier: "small",
      sectorCode: "fintech",
      riskFactors: ["sensitive_data"],
      contactEmail: "lead@empresa.cl",
    });
    expect(result).toEqual({ ok: false, error: "unavailable" });
    expect(errorSpy).toHaveBeenCalled();
  });

  /** Cadena select().eq().gte().limit() del dedupe por correo (D8). */
  const dedupeSelectChain = (rows: Array<{ id: string }>) => ({
    eq: () => ({
      gte: () => ({
        limit: async () => ({ data: rows, error: null }),
      }),
    }),
  });

  it("insert exitoso → recalcula en servidor y persiste el contrato completo", async () => {
    let insertedRow: Record<string, unknown> | undefined;
    adminMock.createAdminClient.mockImplementation(() => ({
      from: (table: string) => {
        expect(table).toBe("self_assessments");
        return {
          select: () => dedupeSelectChain([]),
          insert: async (row: Record<string, unknown>) => {
            insertedRow = row;
            return { error: null };
          },
        };
      },
    }));

    const result = await submitSelfAssessment({
      sizeTier: "enterprise",
      sectorCode: "salud",
      riskFactors: ["sensitive_data", "automated_decisions"],
      contactName: "Ana Soto",
      contactEmail: "ana@clinica.cl",
    });

    expect(result).toEqual({ ok: true });
    expect(insertedRow).toBeDefined();
    expect(insertedRow?.size_tier).toBe("enterprise");
    expect(insertedRow?.sector_code).toBe("salud");
    expect(insertedRow?.estimated_tier).toBe("Bajo cotización");
    // Factores de ajuste recalculados en servidor, en tokens de la migración.
    expect(insertedRow?.risk_factors).toEqual([
      "datos_sensibles",
      "rubro_regulado",
      "decisiones_automatizadas",
    ]);
    expect(insertedRow?.contact_name).toBe("Ana Soto");
    expect(insertedRow?.contact_phone).toBeNull();
    const answers = asRecord(insertedRow?.answers);
    const internal = asRecord(answers.internal);
    expect(internal.score).toBe(85); // (20+12+9+9 volumen) × 1.7 = 84.99… → 85
    expect(internal.score_tier).toBe("critical");
  });

  it("insert con error de Supabase → 'unavailable' con resultado visible", async () => {
    adminMock.createAdminClient.mockImplementation(() => ({
      from: () => ({
        insert: async () => ({ error: { message: "permission denied" } }),
      }),
    }));
    const result = await submitSelfAssessment({
      sizeTier: "micro",
      sectorCode: "retail",
      riskFactors: [],
      contactPhone: "+56912345678",
    });
    expect(result).toEqual({ ok: false, error: "unavailable" });
    expect(errorSpy).toHaveBeenCalled();
  });

  it("honeypot con valor → responde ok:true SIN tocar Supabase (anti-bots)", async () => {
    const result = await submitSelfAssessment({
      sizeTier: "micro",
      sectorCode: "retail",
      riskFactors: [],
      contactEmail: "bot@spam.example",
      website: "https://spam.example",
    });
    expect(result).toEqual({ ok: true });
    expect(adminMock.createAdminClient).not.toHaveBeenCalled();
  });

  it("mismo correo dentro de la ventana de 10 min → ok:true sin insertar de nuevo", async () => {
    const insert = vi.fn(async () => ({ error: null }));
    adminMock.createAdminClient.mockImplementation(() => ({
      from: () => ({
        select: () => dedupeSelectChain([{ id: "lead-previo" }]),
        insert,
      }),
    }));
    const result = await submitSelfAssessment({
      sizeTier: "small",
      sectorCode: "retail",
      riskFactors: [],
      contactEmail: "lead@empresa.cl",
    });
    expect(result).toEqual({ ok: true });
    expect(insert).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// i18n — el catálogo cubre todas las claves derivadas de datos
// ---------------------------------------------------------------------------
describe("i18n selfAssessment/verify — cobertura del catálogo", () => {
  const sa = asRecord(es).selfAssessment as Record<string, unknown> | undefined;
  const verify = asRecord(es).verify as Record<string, unknown> | undefined;

  it("existen los namespaces selfAssessment y verify", () => {
    expect(sa).toBeDefined();
    expect(verify).toBeDefined();
  });

  it("tamaños: opciones, nombres de tramo y precios por cada SIZE_TIER", () => {
    const options = asRecord(asRecord(asRecord(asRecord(sa).steps).size).options);
    const tierNames = asRecord(asRecord(asRecord(sa).result).tierNames);
    const prices = asRecord(asRecord(asRecord(sa).result).prices);
    for (const tier of SIZE_TIERS) {
      expect(options[tier], `option ${tier}`).toBeDefined();
      expect(tierNames[tier], `tierName ${tier}`).toBeTruthy();
      expect(prices[tier], `price ${tier}`).toBeTruthy();
    }
  });

  it("rubros: los 7 SECTOR_CODES tienen label y leyes", () => {
    const options = asRecord(asRecord(asRecord(asRecord(sa).steps).sector).options);
    for (const code of SECTOR_CODES) {
      const entry = asRecord(options[code]);
      expect(entry, `sector ${code}`).toBeDefined();
      expect(entry.label).toBeTruthy();
      expect(entry.laws).toBeTruthy();
    }
  });

  it("factores: pregunta por cada RISK_FACTOR y chip por cada ADJUSTMENT_FACTOR", () => {
    const questions = asRecord(asRecord(asRecord(asRecord(sa).steps).factors).questions);
    for (const factor of RISK_FACTORS) {
      expect(questions[factor], `question ${factor}`).toBeTruthy();
    }
    const chips = asRecord(asRecord(asRecord(sa).result).factors);
    for (const factor of ADJUSTMENT_FACTORS) {
      expect(chips[factor], `chip ${factor}`).toBeTruthy();
    }
  });

  it("verify cubre los estados del enum certificate_status y los 3 estados de página", () => {
    const statuses = asRecord(asRecord(verify).statuses);
    for (const status of ["active", "expired", "revoked"]) {
      expect(statuses[status], `status ${status}`).toBeTruthy();
    }
    expect(asRecord(verify).notFound).toBeDefined();
    expect(asRecord(verify).unavailable).toBeDefined();
    expect(asRecord(verify).valid).toBeDefined();
  });

  it("el resultado público no expone el score interno como texto", () => {
    // Regla RFC §11/§14: nada del catálogo público menciona el Complexity Score.
    expect(JSON.stringify(sa)).not.toMatch(/score/i);
  });
});

// ---------------------------------------------------------------------------
// Guard real de lib/supabase/admin.ts (sin mock)
// ---------------------------------------------------------------------------
describe("createAdminClient (módulo real)", () => {
  it("lanza un error claro si falta el env", async () => {
    const real = await vi.importActual<typeof import("../lib/supabase/admin")>(
      "../lib/supabase/admin",
    );
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    try {
      expect(() => real.createAdminClient()).toThrowError(/SUPABASE_SERVICE_ROLE_KEY/);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
