import { getTranslations } from "next-intl/server";

/**
 * MANIFIESTO — "Nuestra postura" (positioning.md §2, pos. 3): el ancla emocional
 * del sitio, inmediatamente tras el hero. Responde en voz alta la objeción
 * central de toda oferta gratuita y completa —"¿cuál es la trampa?"— antes de
 * que germine. Bloque editorial centrado: eyebrow, título serif, tres párrafos
 * de cuerpo y una línea de cierre destacada (la tesis del negocio). Monocromo.
 */
export async function ManifestoSection() {
  const t = await getTranslations("landing.manifesto");

  return (
    <section
      id="postura"
      className="scroll-mt-[64px] border-y border-ash bg-haze"
    >
      <div className="mx-auto w-full max-w-[760px] px-32 py-100 text-center max-sm:px-16 max-sm:py-60">
        <p className="mb-16 text-caption font-semibold uppercase tracking-[0.4px] text-metal">
          {t("eyebrow")}
        </p>
        <h2 className="mx-auto max-w-[18ch] text-balance font-serif text-heading-sm font-medium leading-heading-sm tracking-heading-sm text-ink sm:text-heading sm:leading-heading sm:tracking-heading">
          {t("title")}
        </h2>
        <div className="mx-auto mt-28 max-w-[62ch] space-y-16 text-body leading-[1.6] tracking-body text-carbon">
          <p>{t("body1")}</p>
          <p>{t("body2")}</p>
          <p>{t("body3")}</p>
        </div>
        {/* Cierre destacado: la tesis del negocio, en ink y peso semibold. */}
        <p className="mx-auto mt-32 max-w-[54ch] border-t border-stone pt-32 text-subheading font-medium leading-[1.4] tracking-subheading text-ink">
          {t("closing")}
        </p>
      </div>
    </section>
  );
}
