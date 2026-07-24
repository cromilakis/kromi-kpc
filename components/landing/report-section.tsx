import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonClasses } from "@/components/ui";
import { REPORT_ITEMS } from "./data";
import { CheckIcon, DocumentIcon } from "./icons";

/**
 * "EL INFORME" (positioning.md §5, pos. 4): el protagonista del sitio. Muestra
 * el entregable en vez de describirlo — una maqueta de una brecha real del
 * informe (izquierda) junto a la lista de lo que contiene (derecha), un anclaje
 * de valor sin precio y el CTA único. El objetivo psicológico: convertir
 * "gratis" en "valioso" y activar la reciprocidad ("ya hicieron el trabajo por mí").
 */
export async function ReportSection() {
  const t = await getTranslations("landing.report");

  return (
    <section
      id="informe"
      className="mx-auto w-full max-w-[1180px] scroll-mt-[64px] px-32 py-80 max-sm:px-16 max-sm:py-60"
    >
      <div className="grid grid-cols-1 items-start gap-48 lg:grid-cols-2 lg:gap-64">
        {/* Columna izquierda: maqueta del informe (una brecha con su plan). */}
        <div className="order-2 lg:order-1">
          <p className="mb-12 text-caption font-semibold uppercase tracking-[0.4px] text-metal">
            {t("mock.eyebrow")}
          </p>
          <div className="overflow-hidden rounded-cards border border-stone bg-white shadow-subtle-2">
            <div className="flex items-center justify-between gap-12 border-b border-ash bg-haze px-20 py-12">
              <span className="text-caption font-semibold uppercase tracking-[0.3px] text-metal">
                {t("mock.breachLabel")}
              </span>
              <span className="rounded-full bg-warning-yellow/10 px-8 py-[3px] text-caption font-semibold text-warning-yellow">
                {t("mock.severity")}
              </span>
            </div>
            <div className="px-20 py-20">
              <p className="text-body font-semibold leading-[1.35] tracking-[-0.2px] text-ink">
                {t("mock.breachTitle")}
              </p>

              <p className="mt-16 text-caption font-semibold uppercase tracking-[0.4px] text-carbon">
                {t("mock.legalLabel")}
              </p>
              <p className="mt-4 text-body-sm leading-[1.5] text-carbon">
                {t("mock.legal")}
              </p>

              <p className="mt-16 text-caption font-semibold uppercase tracking-[0.4px] text-carbon">
                {t("mock.objectiveLabel")}
              </p>
              <p className="mt-4 text-body-sm leading-[1.5] text-carbon">
                {t("mock.objective")}
              </p>

              <p className="mt-16 text-caption font-semibold uppercase tracking-[0.4px] text-carbon">
                {t("mock.actionsLabel")}
              </p>
              <ol className="mt-8 space-y-8">
                {[t("mock.action1"), t("mock.action2")].map((action, i) => (
                  <li key={i} className="flex gap-12">
                    <span
                      aria-hidden
                      className="mt-[1px] flex size-[20px] shrink-0 items-center justify-center rounded-full bg-ash text-caption font-semibold text-carbon"
                    >
                      {i + 1}
                    </span>
                    <span className="text-body-sm leading-[1.45] text-ink">
                      {action}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-12 text-caption leading-[1.5] text-metal">
                {t("mock.evidenceLabel")}: {t("mock.evidence")}
              </p>
            </div>
          </div>
        </div>

        {/* Columna derecha: qué contiene + anclaje de valor + CTA. */}
        <div className="order-1 lg:order-2">
          <p className="mb-16 text-caption font-semibold uppercase tracking-[0.4px] text-metal">
            {t("eyebrow")}
          </p>
          <h2 className="max-w-[16ch] text-balance font-serif text-heading-sm font-medium leading-heading-sm tracking-heading-sm text-ink sm:text-heading sm:leading-heading sm:tracking-heading">
            {t("title")}
          </h2>
          <p className="mt-16 max-w-[52ch] text-body leading-[1.6] tracking-body text-carbon">
            {t("intro")}
          </p>

          <ul className="mt-28 space-y-16">
            {REPORT_ITEMS.map((item) => (
              <li key={item} className="flex gap-12">
                <span
                  aria-hidden
                  className="mt-[2px] flex size-[22px] shrink-0 items-center justify-center rounded-full bg-ink text-white"
                >
                  <CheckIcon size={12} />
                </span>
                <div>
                  <p className="text-body-sm font-semibold tracking-[-0.1px] text-ink">
                    {t(`items.${item}.title`)}
                  </p>
                  <p className="mt-2 text-body-sm leading-[1.5] text-carbon">
                    {t(`items.${item}.text`)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {/* Anclaje de valor sin precio: activa reciprocidad y zero-price effect. */}
          <p className="mt-28 border-l-2 border-ink pl-16 text-body font-medium leading-[1.5] text-ink">
            {t("anchorValue")}
          </p>

          <div className="mt-28">
            <Link
              href="/self-assessment"
              className={buttonClasses("primary", "gap-[9px] px-[22px] py-[13px] text-body")}
            >
              <DocumentIcon className="shrink-0" />
              {t("cta")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
