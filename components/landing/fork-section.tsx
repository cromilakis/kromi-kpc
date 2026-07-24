import type { ComponentType } from "react";
import { getTranslations } from "next-intl/server";
import { SUPPORT_ITEMS } from "./data";
import {
  DocumentIcon,
  RefreshIcon,
  ShieldCheckIcon,
  UserIcon,
} from "./icons";
import { WhatsAppButton } from "./whatsapp-button";

/**
 * "LA BIFURCACIÓN" (positioning.md §7, pos. 9): el único momento comercial del
 * sitio, presentado como elección y no como cierre. Dos caminos simétricos —
 * hazlo por tu cuenta (gratis) / que lo implementemos contigo (WhatsApp). La
 * simetría visual comunica honestidad (nada de "botón grande vs link chiquito")
 * y, al ofrecer sinceramente el camino gratis, reduce la reactancia y aumenta la
 * elección del pago. El camino B contiene las 4 formas de acompañamiento.
 */
const SUPPORT_ICONS: Record<
  (typeof SUPPORT_ITEMS)[number],
  ComponentType<{ size?: number; className?: string }>
> = {
  assigned: UserIcon,
  advisory: DocumentIcon,
  implementation: ShieldCheckIcon,
  followUp: RefreshIcon,
};

export async function ForkSection() {
  const t = await getTranslations("landing.fork");
  const tWa = await getTranslations("landing.whatsapp");

  return (
    <section
      id="implementacion"
      className="mx-auto w-full max-w-[1180px] scroll-mt-[64px] px-32 py-80 max-sm:px-16 max-sm:py-60"
    >
      <div className="mb-40 max-w-[620px]">
        <p className="mb-12 text-caption font-semibold uppercase tracking-[0.4px] text-metal">
          {t("eyebrow")}
        </p>
        <h2 className="text-balance font-serif text-heading-sm font-medium leading-heading-sm tracking-heading-sm text-ink sm:text-heading sm:leading-heading sm:tracking-heading">
          {t("title")}
        </h2>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-16 lg:grid-cols-2">
        {/* Camino A — por tu cuenta, gratis. */}
        <div className="flex flex-col rounded-xl border border-stone bg-white p-32 max-sm:p-24">
          <span className="mb-16 inline-flex w-fit rounded-full border border-stone bg-ash px-12 py-[5px] text-caption font-semibold text-carbon">
            {t("pathA.badge")}
          </span>
          <h3 className="text-subheading font-semibold leading-[1.3] tracking-[-0.2px] text-ink">
            {t("pathA.title")}
          </h3>
          <p className="mt-12 text-body-sm leading-[1.6] text-carbon">
            {t("pathA.text")}
          </p>
        </div>

        {/* Camino B — con acompañamiento (WhatsApp). Fondo ink para diferenciar,
            sin jerarquizar por tamaño: la simetría se mantiene. */}
        <div className="flex flex-col rounded-xl border border-ink bg-ink p-32 text-white max-sm:p-24">
          <span className="mb-16 inline-flex w-fit rounded-full border border-white/25 bg-white/10 px-12 py-[5px] text-caption font-semibold text-white">
            {t("pathB.badge")}
          </span>
          <h3 className="text-subheading font-semibold leading-[1.3] tracking-[-0.2px] text-white">
            {t("pathB.title")}
          </h3>
          <p className="mt-12 text-body-sm leading-[1.6] text-slate">
            {t("pathB.text")}
          </p>

          <p className="mt-24 text-caption font-semibold uppercase tracking-[0.4px] text-lead">
            {t("pathB.itemsLabel")}
          </p>
          <ul className="mt-12 grid grid-cols-1 gap-x-24 gap-y-12 sm:grid-cols-2">
            {SUPPORT_ITEMS.map((item) => {
              const Icon = SUPPORT_ICONS[item];
              return (
                <li key={item} className="flex gap-10">
                  <span className="mt-[2px] flex size-[24px] shrink-0 items-center justify-center rounded-buttons bg-white/10 text-white">
                    <Icon size={14} />
                  </span>
                  <div>
                    <p className="text-body-sm font-semibold text-white">
                      {t(`pathB.items.${item}.title`)}
                    </p>
                    <p className="mt-2 text-caption leading-[1.5] text-slate">
                      {t(`pathB.items.${item}.text`)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-28">
            <WhatsAppButton
              message={tWa("quoteMessage")}
              inverted
              className="px-[22px] py-[13px] text-body"
            >
              {t("pathB.cta")}
            </WhatsAppButton>
          </div>
        </div>
      </div>
    </section>
  );
}
