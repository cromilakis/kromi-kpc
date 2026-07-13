import { describe, expect, it } from "vitest";
import { diagnosisLeadSchema, registrationLeadSchema } from "../lib/self-assessment/lead-schema";

/**
 * Contrato del lead del diagnóstico público. Cubre el camino feliz, la regla de
 * contacto mínimo (correo o teléfono) y los límites anti-abuso (strictObject +
 * honeypot). La server action revalida SIEMPRE con este mismo schema.
 */

const base = {
  name: "Clínica Demo SpA",
  rut: "76.086.428-5",
  contactName: "María Pérez",
  contactEmail: "maria@clinicademo.cl",
  sectorCode: "salud",
  sizeTier: "micro" as const,
  factors: ["sensitive_data"],
  diagnosis: { riskLevel: "critico" as const, totalBreaches: 9 },
};

describe("diagnosisLeadSchema", () => {
  it("acepta un lead completo válido", () => {
    const parsed = diagnosisLeadSchema.safeParse(base);
    expect(parsed.success).toBe(true);
  });

  it("acepta teléfono como único canal de contacto (sin correo)", () => {
    const { contactEmail, ...rest } = base;
    void contactEmail;
    const parsed = diagnosisLeadSchema.safeParse({
      ...rest,
      contactPhone: "+56 9 1234 5678",
    });
    expect(parsed.success).toBe(true);
  });

  it("rechaza cuando no hay correo ni teléfono (contacto mínimo)", () => {
    const { contactEmail, ...rest } = base;
    void contactEmail;
    const parsed = diagnosisLeadSchema.safeParse(rest);
    expect(parsed.success).toBe(false);
  });

  it("rechaza un RUT inválido", () => {
    const parsed = diagnosisLeadSchema.safeParse({ ...base, rut: "12345678-0" });
    expect(parsed.success).toBe(false);
  });

  it("rechaza RUTs de relleno con DV válido (11111111-1, 12345678-5)", () => {
    expect(diagnosisLeadSchema.safeParse({ ...base, rut: "11111111-1" }).success).toBe(false);
    expect(diagnosisLeadSchema.safeParse({ ...base, rut: "12345678-5" }).success).toBe(false);
  });

  it("rechaza claves desconocidas (strictObject anti-abuso)", () => {
    const parsed = diagnosisLeadSchema.safeParse({ ...base, hackerField: "x" });
    expect(parsed.success).toBe(false);
  });

  it("admite el honeypot 'website' en el payload", () => {
    const parsed = diagnosisLeadSchema.safeParse({ ...base, website: "" });
    expect(parsed.success).toBe(true);
  });
});

describe("registrationLeadSchema", () => {
  const base = {
    name: "Clínica Demo SpA",
    rut: "76.086.428-5",
    contactName: "María Pérez",
    contactEmail: "maria@clinicademo.cl",
    sectorCode: "salud",
    sizeTier: "micro" as const,
    factors: ["sensitive_data"],
    diagnosis: { riskLevel: "critico" as const, totalBreaches: 9 },
    password: "supersecreta",
    answers: {
      screening: [{ nodeId: "S-001", value: "micro" }],
      deepDive: [
        { questionId: "DD-001", branchId: "sensitive_data", value: "si" },
      ],
    },
  };

  it("acepta un registro válido con contraseña", () => {
    expect(registrationLeadSchema.safeParse(base).success).toBe(true);
  });

  it("rechaza contraseña de menos de 8 caracteres", () => {
    expect(registrationLeadSchema.safeParse({ ...base, password: "1234567" }).success).toBe(false);
  });

  it("rechaza cuando falta la contraseña", () => {
    const { password, ...rest } = base;
    void password;
    expect(registrationLeadSchema.safeParse(rest).success).toBe(false);
  });

  it("rechaza cuando faltan las respuestas del cuestionario (answers)", () => {
    const { answers, ...rest } = base;
    void answers;
    expect(registrationLeadSchema.safeParse(rest).success).toBe(false);
  });
});
