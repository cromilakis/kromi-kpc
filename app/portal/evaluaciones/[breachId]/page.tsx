import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { cn } from "@/components/ui";
import { getBreachContent } from "@/lib/legal/breach-content";
import { formatFineClp } from "@/lib/legal/fine";
import { loadClientBreach } from "@/lib/portal/load-diagnosis.server";
import { severityTagClass } from "@/lib/portal/severity-tag";

/**
 * /portal/evaluaciones/[breachId] — detalle de una brecha del diagnóstico
 * activo del cliente (spec portal de detalle de brechas, tarea 5). Gated a
 * pagado vía `loadClientBreach()` (Task 3: delega en `loadClientDiagnosis()`,
 * que solo devuelve brechas si `service_paid_at` está fijado); si no existe
 * o pertenece a otra empresa (RLS), `notFound()`. Contenido narrativo
 * ("por qué es un riesgo" / "qué dice la ley") viene de `getBreachContent`
 * (Task 1, borrador pendiente de revisión legal) y es opcional por brecha.
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

  const [t, tEvaluations, tLabel] = await Promise.all([
    getTranslations("portal.evaluations.detail"),
    getTranslations("portal.evaluations"),
    getTranslations("diagnosis.severity.label"),
  ]);

  const content = getBreachContent(breach.breachCode);
  const fine = formatFineClp(breach.fineMinUtm, breach.fineMaxUtm);

  return (
    <div>
      <Link
        href="/portal/evaluaciones"
        className="mb-24 inline-flex items-center gap-4 text-body-sm font-medium text-metal hover:text-ink hover:underline"
      >
        ‹ {t("back")}
      </Link>

      <header className="mb-32">
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
        </div>
        {fine ? (
          <p className="mt-12 text-body-sm text-metal">
            {tEvaluations("fineLabel")}: {fine}
          </p>
        ) : null}
      </header>

      <div className="flex flex-col gap-24">
        <section>
          <h2 className="mb-8 text-body-sm font-semibold text-ink">
            {t("whatWeFound")}
          </h2>
          <p className="max-w-[70ch] text-body leading-[1.55] text-carbon">
            {breach.description}
          </p>
        </section>

        {content?.whyRisk ? (
          <section>
            <h2 className="mb-8 text-body-sm font-semibold text-ink">
              {t("whyRisk")}
            </h2>
            <p className="max-w-[70ch] text-body leading-[1.55] text-carbon">
              {content.whyRisk}
            </p>
          </section>
        ) : null}

        {content?.lawDetail ? (
          <section>
            <h2 className="mb-8 text-body-sm font-semibold text-ink">
              {t("whatLawSays")}
            </h2>
            <p className="max-w-[70ch] text-body leading-[1.55] text-carbon">
              {content.lawDetail}
            </p>
            {breach.articles.length > 0 ? (
              <div className="mt-12">
                <p className="text-caption font-semibold text-carbon">
                  {t("articlesLabel")}
                </p>
                <ul className="mt-4 flex flex-wrap gap-8">
                  {breach.articles.map((article) => (
                    <li
                      key={article}
                      className="rounded-tags bg-ash px-8 py-[2px] text-caption font-medium text-carbon"
                    >
                      {article}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}
