"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Server actions del módulo "acceso del cliente" (spec company-accounts fase
 * 0, tarea 4): el consultor invita al contacto de una empresa a tener cuenta
 * propia. Doctrina de siempre (interview.ts/companies.ts):
 * 1. "use server" + Zod antes de tocar datos.
 * 2. Verificación de sesión + rol consultor en el servidor (defensa en
 *    profundidad además de la RLS de `company_members`, que ya exige
 *    is_consultant() para INSERT/UPDATE/DELETE).
 * 3. La creación del usuario de auth exige el cliente **service-role**
 *    (`lib/supabase/admin.ts`, ya existente): `auth.admin.inviteUserByEmail`
 *    no está disponible con el cliente anon/cookies del usuario. La key
 *    nunca sale del servidor (admin.ts revienta si falta el env server-only).
 * 4. `company_members` se inserta con el cliente de sesión del consultor
 *    (para que el actor de la fila coincida con las políticas RLS
 *    existentes), no con el admin — el admin solo crea el usuario de auth.
 * 5. `audit_log` en la mutación sensible.
 */

export type InviteCompanyMemberError =
  | "validation"
  | "unauthorized"
  | "already_member"
  | "unavailable";

export type InviteCompanyMemberResult =
  | { ok: true }
  | { ok: false; error: InviteCompanyMemberError };

/** Código de violación de unicidad de Postgres (company_members.user_id unique). */
const PG_UNIQUE_VIOLATION = "23505";

const inviteSchema = z.object({
  companyId: z.uuid(),
  email: z.email(),
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
      `[company-members] audit_log (${entry.action}, id=${entry.entityId}) falló:`,
      error.message,
    );
  }
}

/**
 * Invita a una persona a tener acceso de cliente a una empresa: crea (o
 * reutiliza) el usuario de auth vía invitación por correo y lo enlaza a
 * `company_members` en estado 'invited'. Un email que ya es cliente de OTRA
 * empresa (o de esta misma) choca con `unique(user_id)` → `already_member`
 * (un-usuario-una-empresa, decisión fijada de la fase).
 */
export async function inviteCompanyMember(
  companyId: string,
  email: string,
): Promise<InviteCompanyMemberResult> {
  const parsed = inviteSchema.safeParse({ companyId, email });
  if (!parsed.success) return { ok: false, error: "validation" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "unauthorized" };

    // Defensa en profundidad: además de la RLS de company_members (solo
    // is_consultant() puede insertar), se verifica el rol acá mismo antes de
    // usar el cliente service-role (que bypassa RLS por completo).
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    if (profileError) {
      console.error(
        "[company-members] lectura de profile falló:",
        profileError.message,
      );
      return { ok: false, error: "unavailable" };
    }
    if (!profile || (profile.role !== "consultant" && profile.role !== "admin")) {
      return { ok: false, error: "unauthorized" };
    }

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id")
      .eq("id", parsed.data.companyId)
      .maybeSingle();
    if (companyError) {
      console.error(
        "[company-members] lectura de empresa falló:",
        companyError.message,
      );
      return { ok: false, error: "unavailable" };
    }
    if (!company) return { ok: false, error: "validation" };

    // Invitación del usuario de auth: EXCLUSIVA del cliente service-role
    // (auth.admin no existe con el cliente anon/cookies del consultor). Si
    // el email ya tiene cuenta, Supabase devuelve error (email_exists) — se
    // resuelve el user existente por email en vez de fallar, para que un
    // contacto que ya es cliente de otra empresa caiga en `already_member`
    // por el unique(user_id) al insertar, en vez de bloquear la invitación
    // por un error de auth genérico.
    const admin = createAdminClient();
    const invited = await admin.auth.admin.inviteUserByEmail(parsed.data.email);
    let authUserId = invited.data.user?.id ?? null;

    if (!authUserId) {
      const isAlreadyRegistered =
        invited.error?.code === "email_exists" ||
        /already registered|already exists/i.test(invited.error?.message ?? "");
      if (!isAlreadyRegistered) {
        console.error(
          "[company-members] inviteUserByEmail falló:",
          invited.error?.message,
        );
        return { ok: false, error: "unavailable" };
      }

      const { data: existing, error: existingError } =
        await admin.auth.admin.listUsers();
      if (existingError) {
        console.error(
          "[company-members] listUsers falló al resolver email existente:",
          existingError.message,
        );
        return { ok: false, error: "unavailable" };
      }
      const match = existing.users.find(
        (candidate) =>
          candidate.email?.toLowerCase() === parsed.data.email.toLowerCase(),
      );
      if (!match) {
        console.error(
          "[company-members] email reportado como existente pero no se encontró en listUsers",
        );
        return { ok: false, error: "unavailable" };
      }
      authUserId = match.id;
    }

    const { error: memberError } = await supabase.from("company_members").insert({
      user_id: authUserId,
      company_id: parsed.data.companyId,
      invited_by: user.id,
      status: "invited",
    });
    if (memberError) {
      if (memberError.code === PG_UNIQUE_VIOLATION) {
        return { ok: false, error: "already_member" };
      }
      console.error(
        "[company-members] insert de company_members falló:",
        memberError.message,
      );
      return { ok: false, error: "unavailable" };
    }

    await insertAuditLog(supabase, {
      actorId: user.id,
      action: "company_member.invited",
      entity: "company_members",
      entityId: authUserId,
      detail: { company_id: parsed.data.companyId, email: parsed.data.email },
    });

    return { ok: true };
  } catch (cause) {
    console.error("[company-members] inviteCompanyMember no disponible:", cause);
    return { ok: false, error: "unavailable" };
  }
}
