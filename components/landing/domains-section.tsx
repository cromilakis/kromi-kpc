import { getTranslations } from "next-intl/server";
import { SectionHeading } from "@/components/ui";
import { COMPLEMENTARY_DOMAINS, PRINCIPLE_DOMAINS, type DomainRef } from "./data";

/**
 * Grid de los 14 dominios (prototipo isLanding §DOMINIOS, anchor #dominios):
 * dos grupos con divisor de sección (label uppercase + línea flexible) y
 * cards con chip de código + nombre + descripción.
 */

interface DomainDividerProps {
  label: string;
  note: string;
}

function DomainDivider({ label, note }: DomainDividerProps) {
  return (
    <div className="mb-16 flex items-center gap-12">
      <span className="text-caption font-semibold uppercase tracking-[0.4px] text-ink">
        {label}
      </span>
      {/* Contraste AA en texto pequeño: carbon (≤13px). */}
      <span className="text-caption font-medium text-carbon">{note}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-stone" />
    </div>
  );
}

interface DomainGridProps {
  domains: DomainRef[];
  /** Traductor del namespace landing.domains (firma mínima, ver page.tsx). */
  t: (key: string) => string;
}

function DomainGrid({ domains, t }: DomainGridProps) {
  return (
    <div className="grid grid-cols-1 gap-12 md:grid-cols-2 xl:grid-cols-3">
      {domains.map((domain) => (
        <div
          key={domain.code}
          className="rounded-cards border border-stone bg-white p-[18px]"
        >
          <div className="mb-[10px] flex items-center gap-[10px]">
            <span className="rounded-tags bg-ash px-[7px] py-[3px] text-[11px] font-semibold tracking-[0.3px] text-carbon">
              {domain.code}
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.2px] text-ink">
              {t(`items.${domain.key}.name`)}
            </span>
          </div>
          <p className="text-[13px] leading-[1.5] text-metal">
            {t(`items.${domain.key}.description`)}
          </p>
        </div>
      ))}
    </div>
  );
}

export async function DomainsSection() {
  const t = await getTranslations("landing.domains");

  return (
    <section
      id="dominios"
      className="mx-auto w-full max-w-[1180px] scroll-mt-[64px] border-t border-ash px-32 py-80 max-sm:px-16 max-sm:py-60"
    >
      <SectionHeading
        align="center"
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        className="mb-48"
      />

      <DomainDivider label={t("principlesLabel")} note={t("principlesNote")} />
      <div className="mb-40">
        <DomainGrid domains={PRINCIPLE_DOMAINS} t={t} />
      </div>

      <DomainDivider
        label={t("complementaryLabel")}
        note={t("complementaryNote")}
      />
      <DomainGrid domains={COMPLEMENTARY_DOMAINS} t={t} />
    </section>
  );
}
