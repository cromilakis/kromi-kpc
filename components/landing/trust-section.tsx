import { getTranslations } from "next-intl/server";
import { MedalIcon, ShieldCheckIcon } from "./icons";

/**
 * Confianza / autocertificación (prototipo isLanding §CONFIANZA, RFC §15):
 * card única #fbfbfc con dos pilares — dogfooding y confidencialidad por
 * diseño.
 */
export async function TrustSection() {
  const t = await getTranslations("landing.trust");

  return (
    <section className="mx-auto w-full max-w-[1180px] px-32 pb-40 max-sm:px-16">
      <div className="grid grid-cols-1 gap-32 rounded-xl border border-stone bg-[#fbfbfc] p-32 md:grid-cols-2 max-sm:p-20">
        <div className="flex items-start gap-16">
          <span className="flex h-44 w-44 shrink-0 items-center justify-center rounded-buttons bg-ink text-white">
            <MedalIcon size={22} />
          </span>
          <div>
            <div className="mb-[6px] text-body font-semibold tracking-[-0.2px] text-ink">
              {t("dogfooding.title")}
            </div>
            <p className="text-body-sm leading-[1.55] text-metal">
              {t("dogfooding.text")}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-16">
          <span className="flex h-44 w-44 shrink-0 items-center justify-center rounded-buttons border border-slate bg-white text-ink">
            <ShieldCheckIcon />
          </span>
          <div>
            <div className="mb-[6px] text-body font-semibold tracking-[-0.2px] text-ink">
              {t("confidentiality.title")}
            </div>
            <p className="text-body-sm leading-[1.55] text-metal">
              {t("confidentiality.text")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
