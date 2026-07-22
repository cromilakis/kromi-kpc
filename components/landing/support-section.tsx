import type { ComponentType } from "react";
import { getTranslations } from "next-intl/server";
import { SectionHeading } from "@/components/ui";
import { SUPPORT_ITEMS } from "./data";
import {
  DocumentIcon,
  RefreshIcon,
  ShieldCheckIcon,
  UserIcon,
} from "./icons";

/**
 * Acompañamiento consultor (prototipo isLanding §ACOMPAÑAMIENTO): las 4 etapas
 * del acompañamiento — consultor asignado, asesoría, implementación y
 * seguimiento. Header a la izquierda (quiebre de la monotonía centrada,
 * 2026-07-21) y un chip de icono por etapa para diferenciarlas.
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

export async function SupportSection() {
  const t = await getTranslations("landing.support");

  return (
    <section className="mx-auto w-full max-w-[1180px] px-32 py-80 max-sm:px-16 max-sm:py-60">
      <SectionHeading
        align="left"
        title={t("title")}
        description={t("description")}
        className="mb-48 max-w-[560px]"
      />
      <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
        {SUPPORT_ITEMS.map((item) => {
          const Icon = SUPPORT_ICONS[item];
          return (
            <div
              key={item}
              className="rounded-cards border border-stone bg-white p-[22px]"
            >
              <span className="mb-16 flex h-44 w-44 items-center justify-center rounded-buttons bg-ink text-white">
                <Icon size={20} />
              </span>
              <div className="mb-[10px] text-body font-semibold tracking-[-0.2px] text-ink">
                {t(`items.${item}.title`)}
              </div>
              <p className="text-[13px] leading-[1.55] text-carbon">
                {t(`items.${item}.text`)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
