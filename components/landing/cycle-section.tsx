import { getTranslations } from "next-intl/server";
import { SectionHeading } from "@/components/ui";
import { CYCLE_PHASES } from "./data";

/**
 * Ciclo de servicio en 4 fases (prototipo isLanding §CICLO, anchor #ciclo):
 * banda gris #fbfbfc con cards blancas — número de fase, nombre y descripción.
 * Sin plazos comprometidos (RFC §18: los tiempos aún no se miden).
 */
export async function CycleSection() {
  const t = await getTranslations("landing.cycle");

  return (
    <section
      id="ciclo"
      className="scroll-mt-[64px] border-y border-ash bg-[#fbfbfc]"
    >
      <div className="mx-auto w-full max-w-[1180px] px-32 py-80 max-sm:px-16 max-sm:py-60">
        <SectionHeading
          align="center"
          eyebrow={t("eyebrow")}
          title={t("title")}
          className="mb-48"
        />
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {CYCLE_PHASES.map((phase) => (
            <div
              key={phase}
              className="rounded-cards border border-stone bg-white p-[22px]"
            >
              {/* Contraste AA en texto pequeño: carbon (lead no llegaba ni a 3:1). */}
              <div className="mb-[14px] text-caption font-semibold text-carbon">
                {t(`phases.${phase}.number`)}
              </div>
              <div className="mb-8 text-[18px] font-semibold tracking-[-0.3px] text-ink">
                {t(`phases.${phase}.name`)}
              </div>
              <p className="text-[13px] leading-[1.5] text-metal">
                {t(`phases.${phase}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
