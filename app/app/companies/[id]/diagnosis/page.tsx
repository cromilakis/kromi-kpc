import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { PageHeader } from "@/components/app/shell";
import { DiagnosisManager } from "@/components/interview/diagnosis-manager";
import { StatusBadge } from "@/components/ui";
import type { AppliesWhen } from "@/lib/interview/applicability";
import { buildComplianceQuestions, type ControlLike } from "@/lib/interview/questions";
import { loadInterviewGuide } from "@/lib/interview/load-guide.server";
import { createClient } from "@/lib/supabase/server";

/**
 * /app/companies/[id]/diagnosis — Entrevista de diagnóstico (spec
 * diagnóstico, risk high: alimenta el checklist y la elegibilidad de
 * certificación). Server component: carga la empresa, el assessment
 * ACTIVO (status 'open' del ciclo mayor, mismo criterio que checklist), el
 * catálogo de controles con `verification_criteria` (ordenado por dominio y
 * control, igual que el checklist) y la sesión de entrevista más reciente de
 * la empresa (si existe). Toda la interacción (RAT, respuestas de
 * cumplimiento, autoguardado, enlace de autodiagnóstico, materializar) vive
 * en el client component `DiagnosisManager`. Datos con el cliente
 * AUTENTICADO (RLS autoriza consultores).
 */

const companyIdSchema = z.uuid();

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app.diagnosis.meta");
  return { title: t("title") };
}

export default async function DiagnosisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // id que no es UUID (URL manipulada) → 404 sin tocar la base.
  if (!companyIdSchema.safeParse(id).success) notFound();

  const supabase = await createClient();
  const [t, companyRes, assessmentRes, controlsRes, sessionRes, guide] = await Promise.all([
    getTranslations("app.diagnosis"),
    supabase.from("companies").select("id, name, factors").eq("id", id).maybeSingle(),
    supabase
      .from("assessments")
      .select("id, cycle")
      .eq("company_id", id)
      .eq("status", "open")
      .order("cycle", { ascending: false })
      .limit(1)
      .maybeSingle(),
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
  if (assessmentRes.error) {
    throw new Error(`No fue posible cargar la evaluación: ${assessmentRes.error.message}`);
  }
  if (controlsRes.error) {
    throw new Error(`No fue posible cargar los controles: ${controlsRes.error.message}`);
  }
  if (sessionRes.error) {
    throw new Error(`No fue posible cargar la sesión de diagnóstico: ${sessionRes.error.message}`);
  }

  // Orden canónico del catálogo (mismo criterio que el checklist): dominio →
  // control, ordenado en JS porque PostgREST no ordena por tabla embebida al
  // mismo tiempo que por la tabla base con este SDK.
  const orderedControlRows = [...(controlsRes.data ?? [])].sort(
    (a, b) => (a.domains?.sort ?? 0) - (b.domains?.sort ?? 0) || a.sort - b.sort,
  );
  const controls: ControlLike[] = orderedControlRows.map((row) => ({
    code: row.code,
    name: row.name,
    domain_id: row.domain_id,
    verification_criteria: row.verification_criteria,
    // jsonb crudo de la base: null = siempre aplica; { factors_any: [...] } =
    // aplica solo si la empresa declaró alguno de esos factores (Tarea 3).
    appliesWhen: (row.applies_when as AppliesWhen) ?? null,
  }));
  const questions = buildComplianceQuestions(controls);

  const session = sessionRes.data;

  return (
    <>
      <PageHeader
        eyebrow={t("eyebrow", { company: companyRes.data.name })}
        title={t("title")}
        description={t("description")}
        actions={
          <div className="flex items-center gap-8">
            {assessmentRes.data ? (
              <StatusBadge pill variant="neutral">
                {t("cycleBadge", { cycle: assessmentRes.data.cycle })}
              </StatusBadge>
            ) : null}
            {/* Guion de entrevista: botón-icono junto al ciclo (abre imprimible). */}
            <Link
              href={`/app/companies/${companyRes.data.id}/diagnosis/guide`}
              target="_blank"
              title={t("guide.title")}
              aria-label={t("guide.title")}
              className="inline-flex h-32 w-32 items-center justify-center rounded-buttons border border-slate bg-white text-ink transition-colors hover:bg-ash"
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </Link>
          </div>
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
      />
    </>
  );
}
