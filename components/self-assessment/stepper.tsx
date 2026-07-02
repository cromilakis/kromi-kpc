"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/components/ui";

/**
 * Indicador de pasos del autoevaluador. Accesibilidad: <nav> con aria-label,
 * lista ordenada y aria-current="step" en el paso activo; además un contador
 * textual "Paso X de Y" (no se depende solo del color para el estado).
 */
export const STEP_KEYS = ["size", "sector", "factors", "result"] as const;
export type StepKey = (typeof STEP_KEYS)[number];

export interface StepperProps {
  currentIndex: number;
}

export function Stepper({ currentIndex }: StepperProps) {
  const t = useTranslations("selfAssessment.stepper");

  return (
    <nav aria-label={t("label")} className="mb-24">
      <p className="mb-8 text-caption font-medium text-metal" aria-live="polite">
        {t("stepOf", { current: currentIndex + 1, total: STEP_KEYS.length })}
      </p>
      <ol className="flex flex-wrap items-center gap-x-12 gap-y-8">
        {STEP_KEYS.map((key, index) => {
          const state =
            index < currentIndex ? "done" : index === currentIndex ? "current" : "todo";
          return (
            <li
              key={key}
              aria-current={state === "current" ? "step" : undefined}
              className="flex items-center gap-8"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-24 w-24 items-center justify-center rounded-full border text-caption font-semibold",
                  state === "current" && "border-ink bg-ink text-white",
                  state === "done" && "border-ink bg-white text-ink",
                  state === "todo" && "border-slate bg-white text-metal",
                )}
              >
                {index + 1}
              </span>
              <span
                className={cn(
                  "text-[13px] font-medium",
                  state === "current" ? "text-ink" : "text-metal",
                )}
              >
                {t(`steps.${key}`)}
              </span>
              {index < STEP_KEYS.length - 1 ? (
                <span aria-hidden="true" className="ml-4 h-px w-16 bg-slate max-sm:hidden" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
