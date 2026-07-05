"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Server actions del módulo "propuesta al cliente" (spec Fase 2, tarea 2):
 * el consultor publica una propuesta (plan + monto) para que el cliente la
 * vea/acepte en el portal (Tarea 3) y eventualmente pague por Stripe
 * (Tareas 4-5). Doctrina de siempre (company-members.ts/interview.ts):
 * 1. "use server" + Zod ANTES de tocar datos.
 * 2. Verificación de sesión + rol consultor en el servidor (defensa en
 *    profundidad además de la RLS de `proposals`, que ya exige
 *    is_consultant() para INSERT).
 * 3. `audit_log` en la mutación sensible.
 *
 * Simplificación de la Fase 2: no existe un estado 'draft' persistido en la
 * UI del consultor — la propuesta se publica ('sent') al crearla.
 */

export type CreateProposalError = "validation" | "unauthorized" | "unavailable";

export type CreateProposalResult =
  | { ok: true; proposalId: string }
  | { ok: false; error: CreateProposalError };

const createProposalSchema = z.object({
  companyId: z.uuid(),
  plan: z.string().min(1).max(200),
  amountClp: z.number().int().positive(),
});

async function insertAuditLog(
  supabase: Awaited<ReturnType<typeof createClient>>,
  entry: {
    actorId: string;
    action: string;
    entity: string;
    entityId: string;
    detail: Record<string, unknown>;
  },
): Promise<void> {
  const { error } = await supabase.from("audit_log").insert({
    actor_id: entry.actorId,
    action: entry.action,
    entity: entry.entity,
    entity_id: entry.entityId,
    detail: entry.detail as never,
  });
  if (error) {
    console.error(
      `[proposals] audit_log (${entry.action}, id=${entry.entityId}) falló:`,
      error.message,
    );
  }
}

/**
 * Crea y publica una propuesta (plan + monto CLP) para una empresa: el
 * precio lo decide el consultor a partir de la calculadora interna de
 * pricing; el cliente jamás ve el Complexity Score, solo el plan y el monto
 * final publicados acá. Draft→sent simplificado: queda 'sent' desde el
 * insert.
 */
export async function createProposal(
  companyId: string,
  input: { plan: string; amountClp: number },
): Promise<CreateProposalResult> {
  const parsed = createProposalSchema.safeParse({
    companyId,
    plan: input.plan,
    amountClp: input.amountClp,
  });
  if (!parsed.success) return { ok: false, error: "validation" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "unauthorized" };

    // Defensa en profundidad: además de la RLS de proposals (solo
    // is_consultant() puede insertar), se verifica el rol acá mismo.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    if (profileError) {
      console.error("[proposals] lectura de profile falló:", profileError.message);
      return { ok: false, error: "unavailable" };
    }
    if (!profile || (profile.role !== "consultant" && profile.role !== "admin")) {
      return { ok: false, error: "unauthorized" };
    }

    const { data: proposal, error: insertError } = await supabase
      .from("proposals")
      .insert({
        company_id: parsed.data.companyId,
        plan: parsed.data.plan,
        amount_clp: parsed.data.amountClp,
        currency: "clp",
        status: "sent",
        created_by: user.id,
      })
      .select("id")
      .single();
    if (insertError || !proposal) {
      console.error("[proposals] insert de proposal falló:", insertError?.message);
      return { ok: false, error: "unavailable" };
    }

    await insertAuditLog(supabase, {
      actorId: user.id,
      action: "proposal.created",
      entity: "proposals",
      entityId: proposal.id,
      detail: {
        company_id: parsed.data.companyId,
        plan: parsed.data.plan,
        amount_clp: parsed.data.amountClp,
      },
    });

    return { ok: true, proposalId: proposal.id };
  } catch (cause) {
    console.error("[proposals] createProposal no disponible:", cause);
    return { ok: false, error: "unavailable" };
  }
}

export type AcceptProposalError =
  | "validation"
  | "unauthorized"
  | "not_found"
  | "conflict"
  | "unavailable";

export type AcceptProposalResult =
  | { ok: true }
  | { ok: false; error: AcceptProposalError };

const acceptProposalSchema = z.object({ proposalId: z.uuid() });

/**
 * El cliente acepta SU propuesta ('sent' -> 'accepted'). Por diseño de RLS
 * (migración 20260706110000_proposals_payments.sql), el cliente NO tiene
 * policy de UPDATE sobre `proposals` — solo SELECT de la suya. Por eso acá:
 * 1. Se lee la propuesta con el cliente AUTENTICADO (`createClient()`): la
 *    RLS de SELECT (`company_id = current_company_id()`) ya garantiza que
 *    solo puede ver la propia; si no aparece, es que no existe o es de otra
 *    empresa (no se distingue el caso, para no filtrar existencia ajena).
 * 2. El UPDATE se hace con el cliente **service-role** (`lib/supabase/admin.ts`),
 *    recién DESPUÉS de haber verificado la pertenencia con el paso 1 — nunca
 *    antes. El service-role bypassa RLS a propósito acá (no hay otra forma
 *    de mutar `proposals` desde una sesión de cliente); la comprobación de
 *    pertenencia + el filtro `status = 'sent'` en el UPDATE hacen de guardas.
 * 3. `audit_log` también se inserta con service-role: su policy de INSERT
 *    exige `is_consultant()`, que el cliente nunca cumple.
 *
 * Idempotencia: si la propuesta ya está 'accepted', se responde ok:true (el
 * cliente pudo reintentar tras un timeout de red sin haber visto la
 * confirmación); si ya está 'paid' (o en cualquier otro estado que no sea
 * 'sent'/'accepted', p. ej. 'draft'/'expired'), se responde 'conflict': no
 * hay nada razonable que aceptar.
 */
export async function acceptProposal(proposalId: string): Promise<AcceptProposalResult> {
  const parsed = acceptProposalSchema.safeParse({ proposalId });
  if (!parsed.success) return { ok: false, error: "validation" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "unauthorized" };

    // Lectura con el cliente autenticado: RLS (`proposals_client_select`)
    // acota el resultado a la propuesta de SU propia empresa.
    const { data: proposal, error: readError } = await supabase
      .from("proposals")
      .select("id,company_id,status")
      .eq("id", parsed.data.proposalId)
      .maybeSingle();
    if (readError) {
      console.error("[proposals] lectura de proposal falló:", readError.message);
      return { ok: false, error: "unavailable" };
    }
    if (!proposal) return { ok: false, error: "not_found" };

    if (proposal.status === "accepted") return { ok: true };
    if (proposal.status !== "sent") return { ok: false, error: "conflict" };

    // UPDATE con service-role: el cliente no tiene policy de UPDATE por
    // diseño (ver comentario de la función). El filtro `eq("status","sent")`
    // evita una doble-aceptación concurrente (si otra request ya la marcó
    // 'accepted' entre la lectura y este UPDATE, aquí no matchea ninguna
    // fila y se detecta abajo).
    const admin = createAdminClient();
    const { data: updated, error: updateError } = await admin
      .from("proposals")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", parsed.data.proposalId)
      .eq("status", "sent")
      .select("id")
      .maybeSingle();
    if (updateError) {
      console.error("[proposals] update de proposal falló:", updateError.message);
      return { ok: false, error: "unavailable" };
    }
    if (!updated) return { ok: false, error: "conflict" };

    const { error: auditError } = await admin.from("audit_log").insert({
      actor_id: user.id,
      action: "proposal.accepted",
      entity: "proposals",
      entity_id: parsed.data.proposalId,
      detail: { company_id: proposal.company_id },
    });
    if (auditError) {
      console.error(
        `[proposals] audit_log (proposal.accepted, id=${parsed.data.proposalId}) falló:`,
        auditError.message,
      );
    }

    revalidatePath("/portal");
    return { ok: true };
  } catch (cause) {
    console.error("[proposals] acceptProposal no disponible:", cause);
    return { ok: false, error: "unavailable" };
  }
}
