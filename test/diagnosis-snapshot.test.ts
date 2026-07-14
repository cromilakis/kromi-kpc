import { describe, expect, it } from "vitest";
import {
  computeDiagnosisSnapshot,
  toBreachSnapshot,
  type DiagnosisAnswers,
} from "../lib/diagnosis/snapshot";
import type { BreachDescriptor } from "../lib/legal";

const breach: BreachDescriptor = {
  id: "B-SEG-003",
  description: "No hay control de acceso a los datos.",
  severity: "critico",
  articles: ["Art. 14 quáter"],
  fineRangeUtn: { min: 100, max: 5000 },
  estimatedWeeks: 4,
  dimension: 6,
};

describe("toBreachSnapshot", () => {
  it("mapea un BreachDescriptor a snapshot con área derivada del code", () => {
    const s = toBreachSnapshot(breach);
    expect(s.breachCode).toBe("B-SEG-003");
    expect(s.area).toBe("SEG");
    expect(s.areaLabel).toBe("Seguridad de la información");
    expect(s.severity).toBe("critico");
    expect(s.articles).toEqual(["Art. 14 quáter"]);
    expect(s.fineMinUtm).toBe(100);
    expect(s.fineMaxUtm).toBe(5000);
    expect(s.description).toBe("No hay control de acceso a los datos.");
    expect(s.dimension).toBe(6);
  });

  it("es serializable a JSON sin pérdida", () => {
    const s = toBreachSnapshot(breach);
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });
});

describe("computeDiagnosisSnapshot", () => {
  it("sin respuestas devuelve un snapshot vacío coherente", () => {
    const empty: DiagnosisAnswers = { screening: [], deepDive: [] };
    const r = computeDiagnosisSnapshot(empty);
    expect(Array.isArray(r.breaches)).toBe(true);
    expect(r.totalBreaches).toBe(r.breaches.length);
    expect(typeof r.riskLevel).toBe("string");
  });

  it("cada brecha computada tiene la forma de snapshot esperada", () => {
    // Respuesta de tamaño (S-001) para arrancar el screening; el set exacto de
    // brechas depende del motor, así que se valida la FORMA de cada una.
    const answers: DiagnosisAnswers = {
      screening: [{ nodeId: "S-001", value: "micro" }],
      deepDive: [],
    };
    const r = computeDiagnosisSnapshot(answers);
    for (const b of r.breaches) {
      expect(typeof b.breachCode).toBe("string");
      expect(b.area).toBe(b.breachCode.split("-")[1]);
      expect(typeof b.areaLabel).toBe("string");
      expect(["critico", "alto", "medio", "bajo"]).toContain(b.severity);
      expect(Array.isArray(b.articles)).toBe(true);
      expect(typeof b.fineMinUtm).toBe("number");
      expect(typeof b.description).toBe("string");
    }
    expect(JSON.parse(JSON.stringify(r))).toEqual(r);
  });
});
