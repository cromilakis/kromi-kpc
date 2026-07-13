import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeDiagnosisSnapshot, type DiagnosisAnswers } from "./snapshot";

export type PersistDiagnosisResult =
  | { ok: true; diagnosisId: string }
  | { ok: false; error: "unavailable" };

/**
 * Recomputa las brechas desde `answers` (nunca se confía en el cliente), marca
 * la corrida `active` previa de la empresa como `superseded` e inserta la
 * cabecera + las filas de brechas (snapshot inmutable). Service-role.
 *
 * Sin transacción (supabase-js no las expone): si falla el insert de brechas
 * tras crear la cabecera, se loggea y se devuelve error (estado parcial
 * tolerado, consistente con createCompany/provisionCompany).
 */
export async function persistDiagnosis(
  companyId: string,
  answers: DiagnosisAnswers,
  source: "self_service" | "consultant_assisted",
  createdBy?: string | null,
): Promise<PersistDiagnosisResult> {
  const snapshot = computeDiagnosisSnapshot(answers);
  try {
    const admin = createAdminClient();

    // Supersede la corrida activa previa (a lo sumo una active por empresa).
    const { error: supersedeError } = await admin
      .from("company_diagnoses")
      .update({ status: "superseded" })
      .eq("company_id", companyId)
      .eq("status", "active");
    if (supersedeError) {
      console.error("[diagnosis] supersede falló:", supersedeError.message);
      return { ok: false, error: "unavailable" };
    }

    const { data: diagnosis, error: headerError } = await admin
      .from("company_diagnoses")
      .insert({
        company_id: companyId,
        source,
        answers: answers as never,
        risk_level: snapshot.riskLevel,
        total_breaches: snapshot.totalBreaches,
        created_by: createdBy ?? null,
        status: "active",
      })
      .select("id")
      .single();
    if (headerError || !diagnosis) {
      console.error("[diagnosis] insert cabecera falló:", headerError?.message);
      return { ok: false, error: "unavailable" };
    }

    if (snapshot.breaches.length > 0) {
      const { error: breachError } = await admin
        .from("diagnosis_breaches")
        .insert(
          snapshot.breaches.map((b) => ({
            diagnosis_id: diagnosis.id,
            breach_code: b.breachCode,
            area: b.area,
            area_label: b.areaLabel,
            severity: b.severity,
            articles: b.articles,
            fine_min_utm: b.fineMinUtm,
            fine_max_utm: b.fineMaxUtm,
            description: b.description,
            dimension: b.dimension,
          })),
        );
      if (breachError) {
        console.error("[diagnosis] insert brechas falló:", breachError.message);
        return { ok: false, error: "unavailable" };
      }
    }

    return { ok: true, diagnosisId: diagnosis.id };
  } catch (cause) {
    console.error("[diagnosis] persistDiagnosis no disponible:", cause);
    return { ok: false, error: "unavailable" };
  }
}
