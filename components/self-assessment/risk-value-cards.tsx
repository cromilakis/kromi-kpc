import { getTranslations } from "next-intl/server";

/**
 * Bloque "riesgo vs valor" del autoevaluador — réplica del prototipo
 * (cotizador, grid de 2 cards): el riesgo de NO certificarse con ejemplos
 * prácticos del RFC §13 (documentos por WhatsApp, Excel en un equipo) y la
 * multa que parte en los 7 millones de pesos, frente al valor de certificarse
 * (protección económica, cumplimiento demostrable, prestigio).
 * Server component: siempre visible bajo el wizard, como en el prototipo.
 * Desviación normalizada (misma que hero.tsx / prototype-analysis §9.2.2):
 * los rojos saturados de urgencia del prototipo (#a1231f/#fdf3f2/#f3c9c6) se
 * reemplazan por la familia semántica danger-red y su tinte #f6e9e8.
 */
const RISK_EXAMPLES = ["whatsapp", "excel"] as const;
const VALUE_ITEMS = ["protection", "compliance", "prestige"] as const;

export async function RiskValueCards() {
  const t = await getTranslations("selfAssessment");

  return (
    <div className="mt-44 grid items-start gap-16 md:grid-cols-2">
      {/* El riesgo de no contar con certificación */}
      <section className="rounded-xl border border-danger-red/25 bg-[#f6e9e8] p-28 max-sm:p-20">
        <h2 className="mb-16 text-caption font-semibold uppercase tracking-[0.4px] text-danger-red">
          {t("risk.title")}
        </h2>
        <p className="mb-[10px] text-body-sm font-semibold text-ink">
          {t("risk.exampleLead")}
        </p>
        <ul className="mb-[18px] flex flex-col gap-12">
          {RISK_EXAMPLES.map((example) => (
            <li key={example} className="flex items-start gap-[11px]">
              <span
                aria-hidden="true"
                className="mt-8 h-[6px] w-[6px] shrink-0 rounded-full bg-danger-red"
              />
              <span className="text-body-sm leading-[1.5] text-ink">
                {t(`risk.examples.${example}`)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mb-[14px] text-body-sm leading-[1.55] text-metal">
          {t.rich("risk.fine", {
            b: (chunks) => <b className="font-semibold text-ink">{chunks}</b>,
          })}
        </p>
        <p className="text-body-sm leading-[1.55] text-metal">{t("risk.more")}</p>
      </section>

      {/* El valor de certificarse */}
      <section className="rounded-xl border border-[#cfe6d8] bg-[#f1f9f4] p-28 max-sm:p-20">
        <h2 className="mb-12 text-caption font-semibold uppercase tracking-[0.4px] text-success-green">
          {t("value.title")}
        </h2>
        <ul className="flex flex-col gap-[14px]">
          {VALUE_ITEMS.map((item) => (
            <li key={item} className="flex items-start gap-[11px]">
              <span
                aria-hidden="true"
                className="mt-[1px] flex h-20 w-20 shrink-0 items-center justify-center rounded-[6px] bg-[#dcefe3] text-success-green"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
              <div>
                <h3 className="text-body-sm font-semibold text-ink">
                  {t(`value.items.${item}.title`)}
                </h3>
                <p className="mt-[2px] text-[13px] leading-[1.5] text-metal">
                  {t(`value.items.${item}.text`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
