import { z } from "zod";
import { RISK_FACTORS, SECTOR_CODES, SIZE_TIERS } from "./estimate";

/**
 * Validación ESTRICTA (Zod, en servidor) del payload del autoevaluador
 * público. Vive fuera del archivo "use server" porque esos módulos solo
 * pueden exportar funciones async (Next); así el schema es testeable e
 * importable sin la acción.
 *
 * Contacto: los tres campos son opcionales, pero para que el lead sea
 * contactable se exige al menos correo o teléfono (minimización N4: no se
 * pide nada más que lo necesario para responder la cotización).
 *
 * Anti-abuso: strictObject + max length en cada string + riskFactors acotado
 * limitan el tamaño del payload; `website` es el honeypot del formulario (una
 * persona nunca lo completa — la acción descarta el envío si llega con valor).
 * Rate limiting real por IP → Vercel Firewall en Connect (ver init.md
 * pendientes).
 */

/** Dígitos suficientes y solo caracteres telefónicos habituales. */
const PHONE_PATTERN = /^\+?[0-9()\s-]{7,20}$/;
const MIN_PHONE_DIGITS = 7;

export const leadSubmissionSchema = z
  .strictObject({
    sizeTier: z.enum(SIZE_TIERS),
    sectorCode: z.enum(SECTOR_CODES),
    riskFactors: z.array(z.enum(RISK_FACTORS)).max(RISK_FACTORS.length),
    contactName: z.string().trim().min(2).max(120).optional(),
    contactEmail: z
      .string()
      .trim()
      .toLowerCase()
      .max(160)
      .pipe(z.email())
      .optional(),
    contactPhone: z
      .string()
      .trim()
      .regex(PHONE_PATTERN)
      .refine(
        (value) => (value.match(/\d/g)?.length ?? 0) >= MIN_PHONE_DIGITS,
      )
      .optional(),
    /** Honeypot anti-bots: campo oculto en el form; siempre vacío en humanos. */
    website: z.string().max(200).optional(),
  })
  .refine((data) => Boolean(data.contactEmail || data.contactPhone), {
    message: "contact_required",
    path: ["contactEmail"],
  });

export type LeadSubmission = z.infer<typeof leadSubmissionSchema>;
