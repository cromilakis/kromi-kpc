import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DownloadReportButton } from "@/components/documents/download-report-button";
import { CitationChip } from "@/components/legal/citation-chip";
import { BreachEvidence } from "@/components/portal/breach-evidence";
import { BreachResolution } from "@/components/portal/breach-resolution";
import { cn } from "@/components/ui";
import { proposalExists } from "@/lib/documents/mitigation-proposal.server";
import { getTemplate } from "@/lib/documents/templates/registry";
import { getBreachContent } from "@/lib/legal/breach-content";
import { getBreachMitigation } from "@/lib/legal/breach-mitigation";
import { formatFineClp } from "@/lib/legal/fine";
import {
  loadClientBreach,
  loadClientBreachEvidences,
} from "@/lib/portal/load-diagnosis.server";
import { severityTagClass } from "@/lib/portal/severity-tag";

/**
 * /portal/evaluaciones/[breachId] — detalle de una brecha del diagnóstico
 * activo del cliente. Rediseño premium (2026-07-21): el cliente pagó por un
 * entregable de consultoría, así que el detalle se estructura como tal —
 * franja de metadatos de gestión (exposición, prioridad, esfuerzo, plazo,
 * control DPC), diagnóstico con marco legal citado y navegable, y un plan de
 * mitigación con acciones CONCRETAS (qué hacer / cómo / qué evidencia lo
 * respalda) + propuesta en PDF y documentos tipo.
 *
 * Gated a pagado vía loadClientBreach() (RLS acota a su empresa). El contenido
 * narrativo y el plan son borradores pendientes de revisión legal.
 */
interface EvaluationDetailPageProps {
  params: Promise<{ breachId: string }>;
}

export default async function EvaluationDetailPage({
  params,
}: EvaluationDetailPageProps) {
  const { breachId } = await params;
  const breach = await loadClientBreach(breachId);
  if (!breach) notFound();
  const evidences = await loadClientBreachEvidences(breachId);

  const [t, tEvaluations, tLabel] = await Promise.all([
    getTranslations("portal.evaluations.detail"),
    getTranslations("portal.evaluations"),
    getTranslations("diagnosis.severity.label"),
  ]);

  const content = getBreachContent(breach.breachCode);
  const fine = formatFineClp(breach.fineMinUtm, breach.fineMaxUtm);
  const mitigation = getBreachMitigation(breach.breachCode);
  const templates = (mitigation?.templateIds ?? [])
    .map((id) => getTemplate(id))
    .filter((template) => template !== null);
  const hasProposal = proposalExists(breach.breachCode);
  const resolved = breach.resolutionStatus === "resolved";

  // Franja de metadatos: qué convierte esto en un análisis y no una ficha.
  const metaItems = mitigation
    ? [
        { key: "exposure", value: fine ?? "—" },
        { key: "priority", value: t(`priorityValues.${mitigation.priority}`) },
        { key: "effort", value: t(`effortValues.${mitigation.effort}`) },
        { key: "timeframe", value: t("weeks", { weeks: mitigation.estimatedWeeks }) },
        { key: "control", value: mitigation.controlCode },
      ]
    : [{ key: "exposure", value: fine ?? "—" }, { key: "control", value: breach.area }];

  return (
    <div className="mx-auto max-w-[860px]">
      <Link
        href="/portal/evaluaciones"
        className="mb-20 inline-flex items-center gap-4 text-body-sm font-medium text-metal hover:text-ink hover:underline"
      >
        ‹ {t("back")}
      </Link>

      <header className="mb-24">
        <p className="mb-8 text-caption font-semibold uppercase tracking-[0.4px] text-carbon">
          {t("eyebrow")}
        </p>
        <div className="flex flex-wrap items-center gap-10">
          <h1 className="font-serif text-heading-sm font-medium leading-heading-sm tracking-heading-sm text-ink">
            {breach.areaLabel}
          </h1>
          <span
            className={cn(
              "rounded-full px-8 py-[3px] text-caption font-semibold",
              severityTagClass(breach.severity),
            )}
          >
            {tLabel(breach.severity)}
          </span>
          {resolved ? (
            <span className="rounded-full bg-success-green px-8 py-[3px] text-caption font-semibold text-white">
              {tEvaluations("resolvedTag")}
            </span>
          ) : null}
        </div>
      </header>

      {/* Franja de metadatos de gestión. */}
      <dl className="mb-32 grid grid-cols-2 overflow-hidden rounded-cards border border-stone sm:grid-cols-5">
        {metaItems.map((item, index) => (
          <div
            key={item.key}
            className={cn(
              "px-16 py-12",
              index > 0 && "border-t border-stone sm:border-l sm:border-t-0",
              index === 1 && "max-sm:border-t-0",
            )}
          >
            <dt className="text-caption leading-caption text-metal">
              {t(`meta.${item.key}`)}
            </dt>
            <dd className="mt-2 text-body-sm font-semibold text-ink">{item.value}</dd>
          </div>
        ))}
      </dl>

      {/* ─── Diagnóstico ─────────────────────────────────────────────── */}
      <section className="border-t border-ash pt-20">
        <h2 className="mb-16 text-body-sm font-semibold uppercase tracking-[0.4px] text-carbon">
          {t("diagnosisSection")}
        </h2>
        <div className="flex flex-col gap-20">
          <div>
            <h3 className="mb-6 text-body-sm font-semibold text-ink">
              {t("whatWeFound")}
            </h3>
            <p className="max-w-[68ch] text-body leading-[1.55] text-carbon">
              {breach.description}
            </p>
          </div>

          {content?.whyRisk ? (
            <div>
              <h3 className="mb-6 text-body-sm font-semibold text-ink">{t("whyRisk")}</h3>
              <p className="max-w-[68ch] text-body leading-[1.55] text-carbon">
                {content.whyRisk}
              </p>
            </div>
          ) : null}

          {content?.lawDetail ? (
            <div>
              <h3 className="mb-6 text-body-sm font-semibold text-ink">
                {t("whatLawSays")}
              </h3>
              <p className="max-w-[68ch] text-body leading-[1.55] text-carbon">
                {content.lawDetail}
              </p>
              {breach.articles.length > 0 ? (
                <div className="mt-12">
                  <p className="text-caption text-metal">{t("articlesLabel")}</p>
                  <ul className="mt-6 flex flex-wrap gap-8">
                    {breach.articles.map((article) => (
                      <li key={article}>
                        <CitationChip reference={article} />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {/* ─── Plan de mitigación ──────────────────────────────────────── */}
      {mitigation ? (
        <section className="mt-32 border-t border-ash pt-20">
          <h2 className="mb-16 text-body-sm font-semibold uppercase tracking-[0.4px] text-carbon">
            {t("planSection")}
          </h2>

          {/* Objetivo de cierre. */}
          <div className="mb-20 rounded-cards border border-stone bg-[#fbfbfc] p-16">
            <p className="text-caption font-semibold uppercase tracking-[0.4px] text-carbon">
              {t("objectiveLabel")}
            </p>
            <p className="mt-6 max-w-[68ch] text-body leading-[1.5] text-ink">
              {mitigation.objective}
            </p>
          </div>

          {/* Acciones concretas. */}
          <p className="mb-12 text-body-sm font-semibold text-ink">{t("actionsTitle")}</p>
          <ol className="flex flex-col gap-12">
            {mitigation.actions.map((action, index) => (
              <li
                key={action.title}
                className="rounded-cards border border-stone bg-white p-16"
              >
                <div className="flex items-start gap-12">
                  <span
                    aria-hidden
                    className="mt-[1px] flex size-[24px] shrink-0 items-center justify-center rounded-full bg-ink text-caption font-semibold text-white"
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-body-sm font-semibold text-ink">{action.title}</p>
                    <p className="mt-4 max-w-[64ch] text-body-sm leading-[1.55] text-carbon">
                      {action.detail}
                    </p>
                    <p className="mt-10 flex flex-wrap gap-x-6 border-t border-ash pt-10 text-caption leading-[1.5] text-metal">
                      <span className="font-semibold text-carbon">
                        {t("evidenceLabel")}:
                      </span>
                      <span>{action.evidence}</span>
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {/* Documentos: propuesta en profundidad + documentos tipo. */}
          <div className="mt-20 flex flex-col gap-12">
            {hasProposal ? (
              <div className="flex flex-wrap items-center justify-between gap-16 rounded-cards border border-ink bg-ink p-16 text-white">
                <div className="min-w-0 max-w-[56ch]">
                  <p className="text-body-sm font-semibold text-white">
                    {t("proposalTitle")}
                  </p>
                  <p className="mt-2 text-caption leading-[1.5] text-[#b5bdc9]">
                    {t("proposalSummary")}
                  </p>
                </div>
                <DownloadReportButton
                  href={`/portal/evaluaciones/${breach.id}/propuesta`}
                  label={t("downloadProposal")}
                  variant="primary"
                />
              </div>
            ) : null}

            {templates.length > 0 ? (
              <>
                <p className="mt-8 text-body-sm font-semibold text-ink">
                  {t("documentsTitle")}
                </p>
                <p className="max-w-[68ch] text-caption leading-[1.5] text-carbon">
                  {t("documentsHint")}
                </p>
                <ul className="mt-4 flex flex-col gap-12">
                  {templates.map((template) => (
                    <li
                      key={template.id}
                      className="flex flex-wrap items-center justify-between gap-16 rounded-cards border border-stone bg-white p-16"
                    >
                      <div className="min-w-0 max-w-[56ch]">
                        <p className="text-body-sm font-semibold text-ink">
                          {template.title}
                        </p>
                        <p className="mt-2 text-caption leading-[1.5] text-carbon">
                          {template.summary}
                        </p>
                      </div>
                      <DownloadReportButton
                        href={`/portal/documentos/${template.id}`}
                        label={t("downloadTemplate")}
                      />
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ─── Evidencias ──────────────────────────────────────────────── */}
      <section className="mt-32 rounded-cards border border-stone bg-white p-16">
        <BreachEvidence breachId={breach.id} evidences={evidences} />
      </section>

      {/* ─── Resolución ──────────────────────────────────────────────── */}
      <div className="mt-16">
        <BreachResolution breachId={breach.id} resolved={resolved} />
      </div>
    </div>
  );
}
