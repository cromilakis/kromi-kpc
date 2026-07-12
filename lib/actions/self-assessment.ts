"use server";

import { headers } from "next/headers";
import { formatRut } from "@/lib/companies/rut";
import type { SizeTier } from "@/lib/companies/schema";
import { diagnosisLeadSchema } from "@/lib/self-assessment/lead-schema";
import {
  computeServiceUf,
  serviceChargeClp,
} from "@/lib/self-assessment/pricing";
import { getStripe, StripeError } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { z } from "zod";

type DiagnosisLead = z.infer<typeof diagnosisLeadSchema>;

/**
 * Server action del diagnóstico público (/self-assessment): valida con Zod
 * ESTRICTO e inserta el lead en self_assessments vía service role (la tabla no
 * tiene política de INSERT anon a propósito — RLS). El equipo consultor recoge
 * el lead para preparar el diagnóstico completo y la propuesta.
 *
 * Precio: NO se calcula ni se persiste una cifra aquí. Se guarda el valor base
 * referencial por tamaño (estimated_tier); el precio final se ajusta según la
 * complejidad tras el diagnóstico (modelo tamaño + complejidad, no por brechas).
 *
 * Anti-abuso (D8): honeypot `website` (si viene con valor se responde ok sin
 * insertar), dedupe por correo en una ventana de 10 minutos y límites de tamaño
 * en el schema. Rate limiting por IP → Vercel Firewall (pendiente init.md).
 *
 * Degradación con gracia: si falta el env o el insert falla, se loggea y se
 * devuelve { ok:false, error:"unavailable" } — la UI ofrece reintentar/WhatsApp.
 */

/** Valor base referencial por tamaño (espejo del pricing público de la landing). */
const BASE_TIER_LABEL: Record<SizeTier, string> = {
  micro: "Desde 10 UF + IVA",
  small: "Desde 25 UF + IVA",
  enterprise: "Desde 60 UF (bajo cotización)",
};

/** Ventana de dedupe por correo: mismo email en <10 min no se reinserta. */
const DEDUPE_WINDOW_MS = 10 * 60 * 1000;

/**
 * Fila de self_assessments a partir del lead validado. El detalle completo
 * (answers) es de uso interno del equipo consultor; el prospecto no lo ve.
 */
function buildLeadRow(data: DiagnosisLead) {
  return {
    answers: {
      source: "diagnosis_wizard",
      name: data.name,
      rut: formatRut(data.rut),
      factors: [...data.factors],
      diagnosis: {
        risk_level: data.diagnosis.riskLevel,
        total_breaches: data.diagnosis.totalBreaches,
      },
    },
    size_tier: data.sizeTier,
    sector_code: data.sectorCode,
    risk_factors: [...data.factors],
    estimated_tier: BASE_TIER_LABEL[data.sizeTier],
    contact_name: data.contactName,
    contact_email: data.contactEmail ?? null,
    contact_phone: data.contactPhone ?? null,
  };
}

export type SubmitDiagnosisLeadResult =
  | { ok: true }
  | { ok: false; error: "validation" | "unavailable" };

export async function submitDiagnosisLead(
  input: unknown,
): Promise<SubmitDiagnosisLeadResult> {
  const parsed = diagnosisLeadSchema.safeParse(input);
  if (!parsed.success) {
    console.error(
      "[diagnosis-lead] payload inválido:",
      parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.code}`),
    );
    return { ok: false, error: "validation" };
  }
  const data = parsed.data;

  // Honeypot: un humano nunca completa el campo oculto. Se responde ok:true
  // SIN insertar para no darle señal al bot de que fue detectado.
  if (data.website) return { ok: true };

  try {
    const supabase = createAdminClient();

    // Dedupe: mismo correo en la ventana → ok sin duplicar. Si la consulta
    // falla, se sigue con el insert (capturar el lead pesa más que el dedupe).
    if (data.contactEmail) {
      const since = new Date(Date.now() - DEDUPE_WINDOW_MS).toISOString();
      const { data: existing, error: dedupeError } = await supabase
        .from("self_assessments")
        .select("id")
        .eq("contact_email", data.contactEmail)
        .gte("created_at", since)
        .limit(1);
      if (dedupeError) {
        console.error("[diagnosis-lead] dedupe falló:", dedupeError.message);
      } else if (existing && existing.length > 0) {
        return { ok: true };
      }
    }

    const { error } = await supabase
      .from("self_assessments")
      .insert(buildLeadRow(data));

    if (error) {
      console.error("[diagnosis-lead] insert falló:", error.message);
      return { ok: false, error: "unavailable" };
    }
    return { ok: true };
  } catch (cause) {
    console.error("[diagnosis-lead] servicio no disponible:", cause);
    return { ok: false, error: "unavailable" };
  }
}

/**
 * Origin para las URLs de retorno de Checkout (mismo criterio que
 * lib/actions/proposals.ts): NEXT_PUBLIC_SITE_URL > header origin > host.
 */
async function resolveOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("host");
  if (host) return `https://${host}`;
  return "http://localhost:3000";
}

export type StartDiagnosisCheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: "validation" | "disabled" | "unavailable" };

/**
 * Pago online al confirmar el diagnóstico (micro/pequeña, con precio
 * definitivo). Inserta el lead, crea una Stripe Checkout Session (hosted, modo
 * test) por el precio de LANZAMIENTO en CLP (bruto, IVA incluido) y devuelve la
 * URL para redirigir. El estado 'paid' NO se fija aquí ni en el redirect de
 * retorno: lo concilia el webhook verificado por firma (única fuente de verdad).
 *
 * Enterprise no paga online (bajo cotización): la UI no llama a esta action para
 * ese tramo; si llegara igual, se rechaza como 'validation'.
 *
 * Degradación con gracia: si Stripe está deshabilitado (sin key) el lead YA
 * quedó guardado; se devuelve 'disabled' y la UI cae al mensaje de "solicitud
 * recibida" (el consultor contactará), sin perder el lead.
 */
export async function startDiagnosisCheckout(
  input: unknown,
): Promise<StartDiagnosisCheckoutResult> {
  const parsed = diagnosisLeadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };
  const data = parsed.data;

  // Honeypot: bot detectado → ok simulado sin insertar ni cobrar.
  if (data.website) return { ok: false, error: "validation" };

  // Enterprise es bajo cotización: no se cobra online.
  if (data.sizeTier === "enterprise") return { ok: false, error: "validation" };

  const amountClp = serviceChargeClp(computeServiceUf(data.sizeTier, data.factors));

  try {
    const admin = createAdminClient();

    const { data: lead, error: insertError } = await admin
      .from("self_assessments")
      .insert({ ...buildLeadRow(data), amount_clp: amountClp })
      .select("id")
      .single();
    if (insertError || !lead) {
      console.error("[diagnosis-lead] insert (pago) falló:", insertError?.message);
      return { ok: false, error: "unavailable" };
    }

    let stripe;
    try {
      stripe = getStripe();
    } catch (cause) {
      // Sin key: el lead ya quedó guardado; la UI cae al flujo sin pago.
      if (cause instanceof StripeError) return { ok: false, error: "disabled" };
      throw cause;
    }

    const origin = await resolveOrigin();

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "clp",
              product_data: {
                name: `Servicio DPC — ${data.name}`,
                description:
                  "Diagnóstico completo + propuesta de mitigación + certificación (IVA incluido).",
              },
              // CLP zero-decimal: monto en pesos TAL CUAL, sin ×100.
              unit_amount: amountClp,
            },
            quantity: 1,
          },
        ],
        customer_email: data.contactEmail ?? undefined,
        metadata: { kind: "diagnosis_lead", lead_id: lead.id },
        success_url: `${origin}/self-assessment/pago?status=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/self-assessment/pago?status=cancel`,
      });
    } catch (cause) {
      console.error("[diagnosis-lead] checkout.sessions.create falló:", cause);
      return { ok: false, error: "unavailable" };
    }
    if (!session.url) {
      console.error("[diagnosis-lead] Stripe no devolvió session.url");
      return { ok: false, error: "unavailable" };
    }

    const { error: sessionIdError } = await admin
      .from("self_assessments")
      .update({ stripe_session_id: session.id })
      .eq("id", lead.id);
    if (sessionIdError) {
      console.error(
        "[diagnosis-lead] persistir stripe_session_id falló:",
        sessionIdError.message,
      );
      return { ok: false, error: "unavailable" };
    }

    return { ok: true, url: session.url };
  } catch (cause) {
    console.error("[diagnosis-lead] startDiagnosisCheckout no disponible:", cause);
    return { ok: false, error: "unavailable" };
  }
}
