import { z } from "zod";
import {
  classificationSchema,
  complexitySchema,
  identificationSchema,
} from "@/lib/companies/schema";
import { isDummyRut } from "@/lib/companies/rut";

/**
 * Contrato del lead del diagnóstico público (/self-assessment). Vive fuera del
 * archivo "use server" (esos módulos solo exportan funciones async) para ser
 * testeable e importable desde el cliente (validación por paso, UX) y desde la
 * server action (revalidación TOTAL en servidor — jamás se confía en el cliente).
 *
 * Reúne los MISMOS contratos del alta de empresa (identificación +
 * clasificación + factores) más un resumen del diagnóstico, y exige al menos un
 * canal de contacto (correo o teléfono) para que el lead sea contactable
 * (minimización: no se pide nada más que lo necesario para responder).
 *
 * `website` es el honeypot anti-bots del formulario: una persona nunca lo
 * completa; la acción descarta el envío si llega con valor.
 */

/** Niveles de riesgo del diagnóstico (espejo de RiskLevel en lib/legal). */
export const DIAGNOSIS_RISK_LEVELS = [
  "bajo",
  "medio",
  "alto",
  "critico",
] as const;

export const diagnosisLeadSchema = z
  .strictObject({
    ...identificationSchema.shape,
    ...classificationSchema.shape,
    ...complexitySchema.shape,
    diagnosis: z.strictObject({
      riskLevel: z.enum(DIAGNOSIS_RISK_LEVELS),
      totalBreaches: z.number().int().min(0).max(1000),
    }),
    website: z.string().max(200).optional(),
  })
  .refine((data) => Boolean(data.contactEmail || data.contactPhone), {
    message: "contact_required",
    path: ["contactEmail"],
  })
  // Anti-relleno: rechaza RUTs falsos obvios (11111111-1, 12345678-5, etc.).
  .refine((data) => !isDummyRut(data.rut), {
    message: "dummy_rut",
    path: ["rut"],
  });

export type DiagnosisLeadInput = z.infer<typeof diagnosisLeadSchema>;

/**
 * Registro del embudo público de pago: los MISMOS datos del lead + contraseña
 * para crear la cuenta antes de pagar. `panorama` (opcional) viaja para
 * persistir el resumen visible en el portal; se valida laxo (jsonb).
 */
export const registrationLeadSchema = z
  .strictObject({
    ...identificationSchema.shape,
    ...classificationSchema.shape,
    ...complexitySchema.shape,
    diagnosis: z.strictObject({
      riskLevel: z.enum(DIAGNOSIS_RISK_LEVELS),
      totalBreaches: z.number().int().min(0).max(1000),
    }),
    password: z.string().min(8).max(200),
    panorama: z.unknown().optional(),
    answers: z.object({
      screening: z.array(
        z.strictObject({ nodeId: z.string(), value: z.string() }),
      ),
      deepDive: z.array(
        z.strictObject({
          questionId: z.string(),
          branchId: z.string(),
          value: z.string(),
        }),
      ),
    }),
    website: z.string().max(200).optional(),
  })
  .refine((data) => Boolean(data.contactEmail || data.contactPhone), {
    message: "contact_required",
    path: ["contactEmail"],
  })
  .refine((data) => !isDummyRut(data.rut), { message: "dummy_rut", path: ["rut"] });

export type RegistrationLeadInput = z.infer<typeof registrationLeadSchema>;
