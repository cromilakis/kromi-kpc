import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { PageHeader } from "@/components/app/shell";
import { DiagnosisManager } from "@/components/interview/diagnosis-manager";
import type { AppliesWhen } from "@/lib/interview/applicability";
import { buildComplianceQuestions, type ControlLike } from "@/lib/interview/questions";
import { loadInterviewGuide } from "@/lib/interview/load-guide.server";
import { createClient } from "@/lib/supabase/server";

/**
 * /app/companies/[id]/diagnosis/live — Entrevista en vivo (pantalla dedicada y
 * limpia): solo el co-piloto de escucha activa (grabación + timer + clips +
 * preguntas), sin el resto del tablero de diagnóstico. Reusa `DiagnosisManager`
 * en modo `layout="live"` (mismo estado/autoguardado que el diagnóstico). Carga
 * de datos idéntica a la página de diagnóstico; cliente AUTENTICADO (RLS).
 */

const companyIdSchema = z.uuid();

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app.diagnosis.live");
  return { title: t("screenTitle") };
}

export default async function DiagnosisLivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!companyIdSchema.safeParse(id).success) notFound();

  const supabase = await createClient();
  const [t, companyRes, controlsRes, sessionRes, guide] = await Promise.all([
    getTranslations("app.diagnosis.live"),
    supabase.from("companies").select("id, name, factors").eq("id", id).maybeSingle(),
    supabase
      .from("controls")
      .select("code, name, domain_id, verification_criteria, applies_when, sort, domains ( sort )"),
    supabase
      .from("interview_sessions")
      .select("id, status, answers")
      .eq("company_id", id)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    loadInterviewGuide(id),
  ]);

  if (companyRes.error) {
    throw new Error(`No fue posible cargar la empresa: ${companyRes.error.message}`);
  }
  if (!companyRes.data) notFound();
  if (controlsRes.error) {
    throw new Error(`No fue posible cargar los controles: ${controlsRes.error.message}`);
  }
  if (sessionRes.error) {
    throw new Error(`No fue posible cargar la sesión de diagnóstico: ${sessionRes.error.message}`);
  }

  const orderedControlRows = [...(controlsRes.data ?? [])].sort(
    (a, b) => (a.domains?.sort ?? 0) - (b.domains?.sort ?? 0) || a.sort - b.sort,
  );
  const controls: ControlLike[] = orderedControlRows.map((row) => ({
    code: row.code,
    name: row.name,
    domain_id: row.domain_id,
    verification_criteria: row.verification_criteria,
    appliesWhen: (row.applies_when as AppliesWhen) ?? null,
  }));
  const questions = buildComplianceQuestions(controls);
  const session = sessionRes.data;

  return (
    <>
      <PageHeader
        eyebrow={t("screenEyebrow", { company: companyRes.data.name })}
        title={t("screenTitle")}
        description={t("screenDescription")}
        actions={
          <Link
            href={`/app/companies/${companyRes.data.id}/diagnosis`}
            className="text-caption font-medium leading-caption text-carbon underline underline-offset-2 hover:text-ink"
          >
            {t("backToDiagnosis")}
          </Link>
        }
      />

      <DiagnosisManager
        companyId={companyRes.data.id}
        sessionId={session?.id ?? null}
        sessionStatus={session?.status ?? null}
        questions={questions}
        initialAnswers={session?.answers ?? null}
        companyFactors={companyRes.data.factors ?? []}
        guide={guide}
        layout="live"
      />
    </>
  );
}
