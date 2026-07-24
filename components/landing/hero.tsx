import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonClasses } from "@/components/ui";
import { HeroCipher } from "./hero-cipher";
import { CheckCircleIcon, DocumentIcon } from "./icons";

/**
 * HERO de la landing (positioning.md §7, pos. 2): abre con el REGALO, no con el
 * miedo. H1 serif que promete el trabajo ya hecho ("es tuyo"), subtítulo que
 * describe el informe y CTAs sin fricción: primario a la autoevaluación
 * ("Obtén tu informe gratis") y secundario que ancla a "El Informe" (#informe)
 * para ver el entregable antes de empezar. Sin WhatsApp aquí (regla de oro
 * positioning.md §6: no vender antes de dar). Microcopy "sin correo ni teléfono"
 * desactiva la objeción del formulario-cebo. Paleta 100% monocroma.
 */
export async function Hero() {
  const t = await getTranslations("landing");

  // El check se pega a la última palabra del titular (whitespace-nowrap) para
  // que nunca quede huérfano en una línea propia al hacer wrap el H1.
  const title = t("hero.title");
  const lastSpace = title.lastIndexOf(" ");
  const titleHead = lastSpace === -1 ? "" : title.slice(0, lastSpace + 1);
  const titleLastWord = lastSpace === -1 ? title : title.slice(lastSpace + 1);

  return (
    <section className="mx-auto w-full max-w-[1180px] px-32 pb-[64px] pt-[96px] text-center max-sm:px-16 max-sm:pt-60">
      {/* Bloque título→CTAs con el fondo de cifrado binario 2D (HeroCipher). */}
      <div className="relative">
        <HeroCipher />
        <div className="relative z-10">
          {/* Pill de vigencia — Ley 21.719. Tratamiento sobrio (2026-07-21): el
              deadline es un hecho, no una alarma; sin rojo de severidad ni
              parpadeo (regla de marca: apoyo, no amenaza; color solo semántico).
              La urgencia la comunica el texto de la fecha, no el color. */}
          <p className="mb-28 inline-flex flex-wrap items-center justify-center gap-x-[9px] gap-y-4 rounded-full border border-stone bg-ash py-[5px] pl-[10px] pr-[14px] text-caption font-semibold text-carbon">
            {/* Dot + badge agrupados: nunca se separan; en móvil el aviso baja a
                una 2ª línea limpia sin dejar el dot huérfano. */}
            <span className="inline-flex items-center gap-[9px]">
              <span
                aria-hidden="true"
                className="h-8 w-8 rounded-full bg-carbon"
              />
              <span className="inline-flex items-center rounded-full bg-ink px-[9px] py-[2px] text-white">
                {t("hero.lawBadge")}
              </span>
            </span>
            {t("hero.lawNotice")}
          </p>

          <h1 className="mx-auto max-w-[820px] font-serif text-heading font-medium leading-heading tracking-heading text-ink sm:text-heading-lg sm:leading-heading-lg sm:tracking-heading-lg lg:text-display lg:leading-display lg:tracking-display">
            {titleHead}
            {/* Última palabra + check en un bloque sin quiebre: el ícono siempre
                acompaña al texto (check del titular en ink, monocromo). */}
            <span className="whitespace-nowrap">
              {titleLastWord}
              <span className="ml-[14px] inline-flex -translate-y-[3px] align-middle text-ink">
                <CheckCircleIcon className="max-sm:h-[36px] max-sm:w-[36px]" />
              </span>
            </span>
          </h1>

          <p className="mx-auto mt-24 max-w-[560px] text-subheading font-medium leading-[1.4] tracking-subheading text-carbon">
            {t("hero.subtitle")}
          </p>

          <p className="mx-auto mb-12 mt-36 text-[13px] font-semibold tracking-[0.2px] text-carbon">
            {t("hero.quoteLabel")}
          </p>
          {/* CTA primario: obtener el informe (autoevaluación). Secundario: ver
              qué incluye el informe → ancla a la sección "El Informe" (#informe),
              donde vive la maqueta del entregable. Sin WhatsApp en el hero. */}
          <div className="flex flex-wrap items-center justify-center gap-[10px] max-sm:flex-col">
            <Link
              href="/self-assessment"
              className={buttonClasses("primary", "gap-[9px] px-[22px] py-[13px] text-body")}
            >
              <DocumentIcon className="shrink-0" />
              {t("hero.ctaSelfAssessment")}
            </Link>
            <a
              href="#informe"
              className={buttonClasses("secondary", "px-[20px] py-[13px] text-body")}
            >
              {t("hero.ctaSecondary")}
            </a>
          </div>
          {/* Microcopy de fricción cero: elimina la sospecha de "formulario-cebo". */}
          <p className="mx-auto mt-16 text-body-sm font-medium text-metal">
            {t("hero.noContact")}
          </p>
        </div>
      </div>
    </section>
  );
}
