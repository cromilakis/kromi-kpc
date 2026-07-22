"use client";

import { useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/components/ui";
import {
  getBreachMitigation,
  RISK_LEVEL_LABELS,
  type BreachMitigation,
  type FullDiagnosisResult,
  type RiskLevel,
  type Severity,
} from "@/lib/legal";
import { whatsappUrl } from "@/lib/contact";

// Severidad en la paleta monocroma del sistema (acento solo con significado):
// crítico → danger-red (oxblood), alto → warning-yellow (ocre), medio/bajo
// neutros. Nada de rojos/naranjas saturados.
const SEVERITY: Record<Severity, { text: string; tag: string; fill: string }> = {
  critico: {
    text: "text-danger-red",
    tag: "bg-danger-red/10 text-danger-red",
    fill: "bg-danger-red",
  },
  alto: {
    text: "text-warning-yellow",
    tag: "bg-warning-yellow/10 text-warning-yellow",
    fill: "bg-warning-yellow",
  },
  medio: { text: "text-carbon", tag: "bg-ash text-carbon", fill: "bg-carbon" },
  bajo: { text: "text-metal", tag: "bg-ash text-metal", fill: "bg-metal" },
};

const LEVEL_ORDER: RiskLevel[] = ["bajo", "medio", "alto", "critico"];

/** Brecha del resultado con su plan de mitigación (si existe en el catálogo). */
interface BreachWithPlan {
  id: string;
  description: string;
  severity: Severity;
  plan: BreachMitigation | null;
}

export interface DiagnosisResultPanelProps {
  /** Diagnóstico completo (screening + profundización + inferencia). */
  result: FullDiagnosisResult;
}

/**
 * Resultado de la autoevaluación: diagnóstico (áreas + riesgo) + la PROPUESTA
 * DE MITIGACIÓN completa por brecha (objetivo, acciones, prioridad, esfuerzo y
 * plazo). Todo gratis, sin registro. El cliente puede aplicarla por su cuenta
 * o pedir apoyo para implementarla vía WhatsApp (sin hablar de dinero acá: la
 * estimación ocurre en la conversación).
 */
export function DiagnosisResultPanel({ result }: DiagnosisResultPanelProps) {
  const t = useTranslations("diagnosis.result");
  const tLabel = useTranslations("diagnosis.severity.label");
  const tWa = useTranslations("diagnosis.whatsapp");
  const sectionRef = useRef<HTMLElement>(null);

  const hasBreaches = result.totalBreaches > 0;

  // Descargar = imprimir a PDF. Se abren todos los acordeones para que ninguna
  // brecha quede oculta en el PDF; el chrome y los CTA se ocultan con print:hidden.
  function handleDownload() {
    sectionRef.current
      ?.querySelectorAll("details")
      .forEach((d) => {
        d.open = true;
      });
    window.print();
  }

  // Brechas únicas (por id) con su plan, ordenadas por severidad (crítico→bajo).
  const breaches = useMemo<BreachWithPlan[]>(() => {
    const byId = new Map<string, BreachWithPlan>();
    for (const b of result.breaches) {
      if (byId.has(b.id)) continue;
      byId.set(b.id, {
        id: b.id,
        description: b.description,
        severity: b.severity,
        plan: getBreachMitigation(b.id),
      });
    }
    return [...byId.values()].sort(
      (a, b) => LEVEL_ORDER.indexOf(b.severity) - LEVEL_ORDER.indexOf(a.severity),
    );
  }, [result.breaches]);

  const levelIndex = LEVEL_ORDER.indexOf(result.riskLevel);
  const levelStyle = SEVERITY[result.riskLevel];

  const waHref = whatsappUrl(
    tWa("message", {
      level: RISK_LEVEL_LABELS[result.riskLevel],
      count: result.totalBreaches,
    }),
  );

  return (
    <section ref={sectionRef} className="mx-auto w-full max-w-[720px] space-y-32">
      {/* Encabezado — sereno, centrado en las brechas y el camino a resolverlas */}
      <header aria-live="polite">
        <h2 className="text-balance font-serif text-heading-sm font-medium leading-[1.15] tracking-[-0.5px] text-ink">
          {t("headline")}
        </h2>
        <p className="mt-12 max-w-[60ch] text-body leading-[1.55] text-carbon">
          {hasBreaches
            ? t("intro", { count: result.totalBreaches })
            : t("noBreaches")}
        </p>

        {hasBreaches && (
          <div className="mt-24">
            <p className="mb-8 text-caption font-medium text-metal">
              {t("exposureLabel")}
            </p>
            <div className="flex items-center gap-10">
              <div className="flex gap-[3px]" aria-hidden="true">
                {LEVEL_ORDER.map((lvl, i) => (
                  <span
                    key={lvl}
                    className={cn(
                      "h-[6px] w-[26px] rounded-full",
                      i <= levelIndex ? levelStyle.fill : "bg-stone",
                    )}
                  />
                ))}
              </div>
              <span className={cn("text-body-sm font-semibold", levelStyle.text)}>
                {RISK_LEVEL_LABELS[result.riskLevel]}
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Descargar = imprimir a PDF (oculto en el propio PDF). */}
      <div className="flex justify-end print:hidden">
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-8 rounded-buttons border border-slate bg-white px-16 py-[9px] text-body-sm font-medium text-ink transition-colors hover:bg-ash"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {t("download")}
        </button>
      </div>

      {/* Propuesta de mitigación: una brecha por acordeón, con su plan. */}
      {hasBreaches && (
        <div>
          <h3 className="mb-4 text-body-sm font-semibold text-ink">
            {t("proposalTitle")}
          </h3>
          <p className="mb-16 max-w-[62ch] text-caption leading-[1.5] text-metal">
            {t("proposalNote")}
          </p>
          <ul className="space-y-10">
            {breaches.map((breach) => (
              <li key={breach.id}>
                <details className="group rounded-cards border border-stone bg-white [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-start justify-between gap-16 px-20 py-16 max-sm:px-16">
                    <span className="text-body-sm font-medium leading-[1.4] text-ink">
                      {breach.description}
                    </span>
                    <span className="flex shrink-0 items-center gap-10">
                      <span
                        className={cn(
                          "rounded-full px-8 py-[3px] text-caption font-semibold",
                          SEVERITY[breach.severity].tag,
                        )}
                      >
                        {tLabel(breach.severity)}
                      </span>
                      <svg
                        aria-hidden
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="mt-[2px] shrink-0 text-metal transition-transform group-open:rotate-180"
                      >
                        <path
                          d="M6 9l6 6 6-6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </summary>

                  {breach.plan ? (
                    <div className="border-t border-ash px-20 py-16 max-sm:px-16">
                      {/* Meta de cierre */}
                      <p className="text-caption font-semibold uppercase tracking-[0.4px] text-carbon">
                        {t("objectiveLabel")}
                      </p>
                      <p className="mt-4 text-body-sm leading-[1.5] text-carbon">
                        {breach.plan.objective}
                      </p>

                      {/* Metadatos de gestión */}
                      <div className="mt-12 flex flex-wrap gap-x-20 gap-y-6 text-caption text-metal">
                        <span>
                          {t("priorityLabel")}:{" "}
                          <strong className="font-semibold text-carbon">
                            {t(`priorityValues.${breach.plan.priority}`)}
                          </strong>
                        </span>
                        <span>
                          {t("effortLabel")}:{" "}
                          <strong className="font-semibold text-carbon">
                            {t(`effortValues.${breach.plan.effort}`)}
                          </strong>
                        </span>
                        <span>
                          {t("timeframeLabel")}:{" "}
                          <strong className="font-semibold text-carbon">
                            {t("weeks", { weeks: breach.plan.estimatedWeeks })}
                          </strong>
                        </span>
                      </div>

                      {/* Acciones concretas */}
                      <p className="mt-16 text-caption font-semibold uppercase tracking-[0.4px] text-carbon">
                        {t("actionsLabel")}
                      </p>
                      <ol className="mt-8 space-y-12">
                        {breach.plan.actions.map((action, i) => (
                          <li key={i} className="flex gap-12">
                            <span
                              aria-hidden
                              className="mt-[1px] flex size-[20px] shrink-0 items-center justify-center rounded-full bg-ash text-caption font-semibold text-carbon"
                            >
                              {i + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-body-sm font-medium leading-[1.4] text-ink">
                                {action.title}
                              </p>
                              <p className="mt-2 text-body-sm leading-[1.5] text-carbon">
                                {action.detail}
                              </p>
                              <p className="mt-4 text-caption leading-[1.5] text-metal">
                                {t("evidenceLabel")}: {action.evidence}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : (
                    <div className="border-t border-ash px-20 py-16 text-body-sm text-metal max-sm:px-16">
                      {t("noPlan")}
                    </div>
                  )}
                </details>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA — aplícala tú mismo (gratis) o pide apoyo para implementarla. */}
      <div className="rounded-cards border border-stone bg-ash/60 p-24 max-sm:p-20 print:hidden">
        <h3 className="text-subheading font-semibold leading-[1.3] tracking-[-0.2px] text-ink">
          {t("cta.title")}
        </h3>
        <p className="mt-8 max-w-[62ch] text-body-sm leading-[1.55] text-carbon">
          {t("cta.body")}
        </p>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-16 inline-flex items-center gap-8 rounded-buttons bg-ink px-24 py-12 text-body-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.23 8.23 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.8-.78.97-.15.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42l-.48-.01c-.16 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29Z" />
          </svg>
          {t("cta.button")}
        </a>
      </div>
    </section>
  );
}
