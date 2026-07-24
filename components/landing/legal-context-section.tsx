import { getTranslations } from "next-intl/server";
import { STAKES } from "./data";

/**
 * "POR QUÉ ESTO IMPORTA" — contexto legal (positioning.md §7, pos. 7): la banda
 * de sanciones de la Ley 21.719, reencuadrada. Bajó de la posición 2 a la 7 y de
 * "El riesgo" (amenaza que abre) a "contexto que informa": la urgencia se sirve
 * como dato para decidir con información, no con miedo. Cierra en apoyo ("cumplir
 * es abordable"). Extraída de la antigua StakesSection. Medidor monocromo de
 * gravedad; sin rojos saturados (regla de marca: color solo semántico).
 */
export async function LegalContextSection() {
  const t = await getTranslations("landing.stakes");

  return (
    <section
      id="riesgo"
      className="mx-auto w-full max-w-[1180px] scroll-mt-[64px] px-32 py-80 max-sm:px-16 max-sm:py-60"
    >
      <div className="mb-40 max-w-[620px]">
        <p className="mb-12 text-caption font-semibold uppercase tracking-[0.4px] text-metal">
          {t("sectionEyebrow")}
        </p>
        <h2 className="text-balance font-serif text-heading-sm font-medium leading-heading-sm tracking-heading-sm text-ink sm:text-heading sm:leading-heading sm:tracking-heading">
          {t("sectionTitle")}
        </h2>
        <p className="mt-16 max-w-[52ch] text-body leading-[1.6] tracking-body text-carbon">
          {t("sectionLead")}
        </p>
      </div>

      {/* Banda de contexto: sanciones de la Ley 21.719 (UTM / CLP) como dato. */}
      <div className="overflow-hidden rounded-xl border border-stone bg-white text-left shadow-[rgba(28,40,64,0.08)_0px_8px_24px_-12px]">
        <div className="flex flex-wrap items-center justify-between gap-16 border-b border-ash bg-haze px-24 py-[18px]">
          <span className="text-[13px] font-semibold tracking-[-0.1px] text-ink">
            {t("title")}
          </span>
          <span className="text-[13px] font-medium text-carbon">
            {t("note")}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3">
          {STAKES.map((stake) => (
            <div
              key={stake.key}
              className="border-ash p-24 max-sm:border-t sm:border-l sm:first:border-l-0 max-sm:first:border-t-0"
            >
              <div className="mb-[14px] flex items-center gap-[10px]">
                {/* Medidor monocromo: gravedad por cantidad y altura de barras. */}
                <span aria-hidden="true" className="flex items-end gap-[3px]">
                  {[6, 10, 14].map((h, bar) => (
                    <span
                      key={h}
                      style={{ height: h }}
                      className={`w-[4px] rounded-full ${
                        bar < stake.level ? "bg-ink" : "bg-stone"
                      }`}
                    />
                  ))}
                </span>
                <span className="text-[13px] font-semibold text-ink">
                  {t(`items.${stake.key}.severity`)}
                </span>
              </div>
              {/* Serif solo >= 28px (heading-sm) por la regla de .kromi/design.md. */}
              <div className="font-serif text-heading-sm font-medium leading-heading-sm tracking-heading-sm text-ink">
                {t(`items.${stake.key}.utm`)}
              </div>
              <div className="mt-4 text-[13px] text-carbon">
                {t(`items.${stake.key}.clp`)}
              </div>
            </div>
          ))}
        </div>
        {/* Cierre: encuadre de apoyo — cumplir es abordable. */}
        <div className="border-t border-ash bg-haze px-24 py-[18px]">
          <p className="text-[13px] leading-[1.55] text-carbon">
            <b className="font-semibold text-ink">{t("supportLead")}</b>{" "}
            {t("support")}
          </p>
        </div>
      </div>
    </section>
  );
}
