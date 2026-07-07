"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button, Input, Select, StatusBadge, Textarea, cn } from "@/components/ui";
import { proposeRemediationForSession } from "@/lib/actions/interview";
import { createRemediationsFromProposal } from "@/lib/actions/remediation";
import type { EnrichedProposalItem } from "@/lib/actions/interview";

/**
 * Panel "Propuesta de resolución" (Fase 2): al abrir el diagnóstico se listan
 * TODAS las acciones de mitigación de las brechas (mapeo determinista
 * `buildRemediationProposal`, sin LLM) como una pantalla de RESUMEN. El consultor
 * puede ver el detalle de cada acción (editar acción/prioridad/esfuerzo/plazo),
 * eliminar las que no correspondan y, al final, CONFIRMAR el lote completo: se
 * crean de una vez las tareas en el Plan de adecuación (origin='diagnosis'). No
 * se crea nada hasta confirmar.
 */

type ProposalError = "generic";

// Cada fila es editable en el detalle antes de confirmar.
type EditableItem = EnrichedProposalItem & { dueDate: string };

const PRIORITIES = ["alta", "media", "baja"] as const;
const EFFORTS = ["bajo", "medio", "alto"] as const;

// Plazo por defecto = hoy + semanas sugeridas, en YYYY-MM-DD (input date).
function dueFromWeeks(weeks: number): string {
  const d = new Date();
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

export function ResolutionProposal({
  sessionId,
  companyId,
}: {
  sessionId: string;
  companyId: string;
}) {
  const t = useTranslations("app.diagnosis.proposal");

  // null = cargando (primera generación); [] = sin brechas.
  const [items, setItems] = useState<EditableItem[] | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [confirmedCount, setConfirmedCount] = useState<number | null>(null);
  const [error, setError] = useState<ProposalError | null>(null);
  const [genPending, startGen] = useTransition();
  const [confirmPending, startConfirm] = useTransition();

  function keyOf(item: EditableItem) {
    return `${item.controlCode}#${item.criterionIndex}`;
  }

  // Genera (o recalcula) el resumen desde el borrador vigente del diagnóstico.
  // Los resets van DENTRO de la transición: llamada desde el efecto de montaje,
  // hacer setState síncrono en el efecto dispararía renders en cascada.
  const generate = useCallback(() => {
    startGen(async () => {
      setError(null);
      setConfirmedCount(null);
      setExpandedKey(null);
      const result = await proposeRemediationForSession(sessionId);
      if (result.ok) {
        setItems(
          result.proposal.map((item) => ({
            ...item,
            dueDate: dueFromWeeks(item.suggestedDueWeeks),
          })),
        );
      } else {
        setError("generic");
        setItems([]);
      }
    });
  }, [sessionId]);

  // Por defecto se listan todas las mitigaciones al montar el panel.
  useEffect(() => {
    generate();
  }, [generate]);

  function patch(key: string, changes: Partial<EditableItem>) {
    setItems((current) =>
      current
        ? current.map((item) => (keyOf(item) === key ? { ...item, ...changes } : item))
        : current,
    );
  }

  function handleRemove(key: string) {
    setItems((current) =>
      current ? current.filter((item) => keyOf(item) !== key) : current,
    );
    if (expandedKey === key) setExpandedKey(null);
  }

  function handleConfirm() {
    if (!items) return;
    const payload = items
      .filter((item) => item.action.trim())
      .map((item) => ({
        controlCode: item.controlCode,
        criterionIndex: item.criterionIndex,
        title: item.action.trim(),
        priority: item.priority,
        effort: item.effort,
        dueDate: item.dueDate || undefined,
      }));
    if (payload.length === 0) return;
    setError(null);
    startConfirm(async () => {
      const result = await createRemediationsFromProposal({ companyId, items: payload });
      if (result.ok) {
        setConfirmedCount(result.created);
        setItems(null);
      } else {
        setError("generic");
      }
    });
  }

  const loading = genPending && items === null;
  const count = items?.length ?? 0;

  return (
    <section aria-labelledby="diagnosis-proposal-title" className="flex flex-col gap-16">
      <div className="flex flex-wrap items-start justify-between gap-8">
        <div>
          <h2
            id="diagnosis-proposal-title"
            className="text-body-sm font-semibold text-ink"
          >
            {t("title")}
          </h2>
          <p className="mt-4 text-caption leading-caption text-carbon">{t("subtitle")}</p>
        </div>
        <Button
          variant="secondary"
          onClick={generate}
          disabled={genPending || confirmPending}
        >
          {t("recalculate")}
        </Button>
      </div>

      {loading ? (
        <p className="text-caption leading-caption text-carbon">{t("loading")}</p>
      ) : null}

      {error ? (
        <p role="alert" className="text-caption leading-caption text-danger-red">
          {t(`errors.${error}`)}
        </p>
      ) : null}

      {confirmedCount !== null ? (
        <p role="status" className="text-caption leading-caption text-success-green">
          {t("confirmed", { n: confirmedCount })}
        </p>
      ) : null}

      {!loading && confirmedCount === null && items !== null && items.length === 0 ? (
        <p className="text-caption leading-caption text-carbon">{t("empty")}</p>
      ) : null}

      {items && items.length > 0 ? (
        <>
          {/* Barra de resumen + confirmación del lote completo. */}
          <div className="flex flex-wrap items-center justify-between gap-8 rounded-cards border border-stone bg-ash px-12 py-8">
            <span className="text-caption font-medium leading-caption text-ink">
              {t("count", { n: count })}
            </span>
            <Button onClick={handleConfirm} disabled={confirmPending || genPending}>
              {confirmPending ? t("confirming") : t("confirm")}
            </Button>
          </div>

          <ul className="flex flex-col gap-6">
            {items.map((item) => {
              const key = keyOf(item);
              const expanded = expandedKey === key;
              return (
                <li key={key}>
                  <div
                    className={cn(
                      "rounded-cards border border-stone bg-white",
                      expanded && "border-ink/20",
                    )}
                  >
                    {/* Fila compacta: veredicto + control + acción (una línea). */}
                    <div className="flex items-center gap-8 px-12 py-8">
                      <StatusBadge variant={item.gapType === "no" ? "negative" : "warning"}>
                        {t(`verdict.${item.gapType}`)}
                      </StatusBadge>
                      <button
                        type="button"
                        onClick={() => setExpandedKey(expanded ? null : key)}
                        className="flex min-w-0 flex-1 cursor-pointer items-center gap-6 text-left"
                        aria-expanded={expanded}
                      >
                        <span className="shrink-0 text-caption font-medium leading-caption text-ink">
                          {item.controlName}
                        </span>
                        <span className="truncate text-caption leading-caption text-carbon">
                          {item.action}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedKey(expanded ? null : key)}
                        className="shrink-0 cursor-pointer whitespace-nowrap text-caption leading-caption text-metal hover:text-ink"
                      >
                        {expanded ? t("hideDetail") : t("detail")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(key)}
                        title={t("remove")}
                        aria-label={t("removeAria", { control: item.controlName })}
                        className="shrink-0 cursor-pointer rounded-buttons p-4 text-metal transition-colors hover:bg-ash hover:text-danger-red"
                      >
                        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Detalle editable. */}
                    {expanded ? (
                      <div className="flex flex-col gap-8 border-t border-stone px-12 py-12">
                        {item.criterion ? (
                          <p className="text-caption leading-caption text-carbon">
                            {item.criterion}
                          </p>
                        ) : null}
                        <Textarea
                          value={item.action}
                          onChange={(event) => patch(key, { action: event.target.value })}
                          aria-label={t("actionLabel")}
                          className="min-h-[44px]"
                        />
                        {item.example ? (
                          <p className="text-caption leading-caption text-carbon">
                            {item.example}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-x-16 gap-y-8">
                          <label className="flex items-center gap-6 text-caption leading-caption text-carbon">
                            {t("priorityLabel")}
                            <div className="w-[108px]">
                              <Select
                                value={item.priority}
                                onChange={(event) =>
                                  patch(key, {
                                    priority: event.target.value as EditableItem["priority"],
                                  })
                                }
                                className="cursor-pointer"
                              >
                                {PRIORITIES.map((p) => (
                                  <option key={p} value={p}>
                                    {t(`priority.${p}`)}
                                  </option>
                                ))}
                              </Select>
                            </div>
                          </label>
                          <label className="flex items-center gap-6 text-caption leading-caption text-carbon">
                            {t("effortLabel")}
                            <div className="w-[108px]">
                              <Select
                                value={item.effort}
                                onChange={(event) =>
                                  patch(key, {
                                    effort: event.target.value as EditableItem["effort"],
                                  })
                                }
                                className="cursor-pointer"
                              >
                                {EFFORTS.map((e) => (
                                  <option key={e} value={e}>
                                    {t(`effort.${e}`)}
                                  </option>
                                ))}
                              </Select>
                            </div>
                          </label>
                          <label className="flex items-center gap-6 text-caption leading-caption text-carbon">
                            {t("dueLabel")}
                            <div className="w-[150px]">
                              <Input
                                type="date"
                                value={item.dueDate}
                                onChange={(event) => patch(key, { dueDate: event.target.value })}
                              />
                            </div>
                          </label>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </section>
  );
}
