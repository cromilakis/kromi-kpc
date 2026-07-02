"use client";

import { useTranslations } from "next-intl";
import { whatsappUrl } from "@/components/landing/whatsapp";
import type { EstimateResult } from "@/lib/self-assessment/estimate";

/**
 * Card de resultado del autoevaluador — réplica de la card oscura del
 * cotizador del prototipo (fondo Ink, radius 12, precio en serif 40px,
 * chips de factores y CTA blanco a WhatsApp).
 *
 * REGLA DE NEGOCIO (RFC §11/§14): acá SOLO se muestran tramo, orientación de
 * valor, nota y chips. `result.internal` (Complexity Score) NUNCA se
 * renderiza — es de uso exclusivo del equipo consultor.
 */
export interface ResultPanelProps {
  result: EstimateResult;
}

export function ResultPanel({ result }: ResultPanelProps) {
  const t = useTranslations("selfAssessment.result");
  const tCommon = useTranslations("common");

  return (
    <section
      aria-live="polite"
      className="rounded-xl bg-ink p-[30px] text-white max-sm:p-20"
    >
      <p className="mb-8 text-caption font-medium text-lead">{t("eyebrow")}</p>
      <h2 className="mb-4 text-[15px] font-semibold">
        {t(`tierNames.${result.sizeTier}`)}
      </h2>
      <p className="mb-20 font-serif text-heading font-medium leading-none tracking-[-0.8px]">
        {t(`prices.${result.sizeTier}`)}
      </p>
      <div aria-hidden="true" className="mb-[18px] h-px bg-[#2c2d30]" />
      <p className="mb-[14px] text-[13px] leading-[1.5] text-lead">
        {t(`notes.${result.noteKey}`)}
      </p>
      {result.hasAdjustments ? (
        <ul className="mb-[18px] flex flex-wrap gap-[6px]">
          {result.adjustmentFactors.map((factor) => (
            <li
              key={factor}
              className="rounded-full bg-[#2c2d30] px-[10px] py-4 text-[11px] font-medium text-white"
            >
              {t(`factors.${factor}`)}
            </li>
          ))}
        </ul>
      ) : null}
      <a
        href={whatsappUrl(t("whatsappMessage"))}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-[9px] rounded-buttons bg-white px-12 py-12 text-body-sm font-medium text-ink transition-opacity hover:opacity-90"
      >
        {t("ctaWhatsApp")}
        {/* target="_blank" anunciado a lectores de pantalla. */}
        <span className="sr-only">{tCommon("opensInNewWindow")}</span>
      </a>
      <p className="mt-12 text-caption leading-caption text-lead">
        {t("disclaimer")}
      </p>
    </section>
  );
}
