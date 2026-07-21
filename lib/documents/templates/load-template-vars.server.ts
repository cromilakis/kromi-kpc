import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ReportError } from "../report-http";
import type { TemplateVars } from "./types";

export type TemplateVarsResult =
  | { ok: true; vars: TemplateVars }
  | { ok: false; error: ReportError };

/**
 * Variables de empresa para personalizar un documento tipo, con el mismo gate
 * del informe: sesión de cliente + servicio pagado (RLS acota a su empresa).
 */
export async function loadClientTemplateVars(): Promise<TemplateVarsResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "unauthorized" };

    const { data: company } = await supabase
      .from("company_client_view")
      .select("name, rut, service_paid_at")
      .maybeSingle();
    if (!company) return { ok: false, error: "unauthorized" };
    if (!company.service_paid_at) return { ok: false, error: "no_paid" };

    const generatedDate = new Intl.DateTimeFormat("es-CL", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "America/Santiago",
    }).format(new Date());

    return {
      ok: true,
      vars: {
        companyName: company.name ?? "",
        companyRut: company.rut ?? "",
        generatedDate,
      },
    };
  } catch (cause) {
    console.error("[documents] loadClientTemplateVars falló:", cause);
    return { ok: false, error: "unavailable" };
  }
}
