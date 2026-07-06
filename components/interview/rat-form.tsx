"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Card, Field, Input, StatusBadge, Textarea, cn } from "@/components/ui";
import { LEGAL_BASES, ratActivitySchema, type RatActivity } from "@/lib/interview/rat-schema";
import { CountryMultiSelect } from "./country-multi-select";

/**
 * Sección A del diagnóstico — RAT (Registro de Actividades de Tratamiento):
 * CRUD 100% local sobre el array `answers.rat` (el padre —diagnosis-manager—
 * autoguarda el objeto `answers` completo vía saveDiagnosisDraft, esta pieza
 * solo edita el array en memoria). "Agregar actividad" abre un formulario en
 * blanco; "Editar" reabre el mismo formulario con los datos de la fila.
 * Los campos de arreglo (categorías, destinatarios, encargados, países,
 * medidas de seguridad) se editan como texto separado por comas — sin UI de
 * chips, alcance acotado del diagnóstico asistido. Validación con
 * `ratActivitySchema` (mismo esquema que valida el server en saveDiagnosisDraft
 * / materializeDiagnosis) antes de aceptar la actividad en el array.
 */

function emptyActivity(companyFactors?: string[]): RatActivity {
  return {
    area: "",
    name: "",
    purpose: "",
    legalBasis: "consentimiento",
    dataCategories: [],
    dataSubjects: [],
    source: "",
    recipients: [],
    processors: [],
    intlTransfer: false,
    intlCountries: [],
    retention: "",
    securityMeasures: [],
    isSensitive: companyFactors?.includes("sensitive_data") ?? false,
    notes: "",
  };
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

// Una actividad se considera "completa" cuando tiene descritos los campos
// mínimos de un RAT útil (nombre, finalidad, categorías, titulares, retención).
function isActivityComplete(activity: RatActivity): boolean {
  return Boolean(
    activity.name.trim() &&
      activity.purpose.trim() &&
      activity.retention.trim() &&
      activity.dataCategories.length > 0 &&
      activity.dataSubjects.length > 0,
  );
}

export function RatForm({
  activities,
  onChange,
  companyFactors,
  title,
  description,
}: {
  activities: RatActivity[];
  onChange: (next: RatActivity[]) => void;
  companyFactors?: string[];
  /** Título/descripción de la sección (se renderiza con el botón "Agregar"). */
  title?: string;
  description?: string;
}) {
  const t = useTranslations("app.diagnosis.rat");
  const tLegal = useTranslations("app.diagnosis.rat.legalBases");

  const [draft, setDraft] = useState<RatActivity | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false); // selector de base de licitud
  const legalRef = useRef<HTMLDivElement | null>(null);

  // Cierra el selector de base de licitud al hacer clic fuera.
  useEffect(() => {
    if (!legalOpen) return;
    const handler = (event: MouseEvent) => {
      if (legalRef.current && !legalRef.current.contains(event.target as Node)) {
        setLegalOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [legalOpen]);

  function startAdd() {
    setDraft(emptyActivity(companyFactors));
    setEditingIndex(null);
    setError(false);
  }

  function startEdit(index: number) {
    const activity = activities[index]!;
    setDraft({ ...activity });
    setEditingIndex(index);
    setError(false);
  }

  function cancel() {
    setDraft(null);
    setEditingIndex(null);
    setError(false);
  }

  function remove(index: number) {
    onChange(activities.filter((_, i) => i !== index));
    if (editingIndex === index) cancel();
  }

  function save() {
    if (!draft) return;
    const parsed = ratActivitySchema.safeParse(draft);
    if (!parsed.success) {
      setError(true);
      return;
    }
    const next = [...activities];
    if (editingIndex === null) {
      next.push(parsed.data);
    } else {
      next[editingIndex] = parsed.data;
    }
    onChange(next);
    setDraft(null);
    setEditingIndex(null);
    setError(false);
  }

  return (
    <div className="flex flex-col gap-16">
      {title || description ? (
        <div className="flex flex-wrap items-start justify-between gap-12">
          <div className="min-w-0">
            {title ? (
              <h2
                id="diagnosis-rat-title"
                className="text-body-sm font-semibold text-ink"
              >
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-4 text-caption leading-caption text-carbon">
                {description}
              </p>
            ) : null}
          </div>
          {!draft ? (
            <Button
              variant="secondary"
              onClick={startAdd}
              className="flex shrink-0 items-center gap-6"
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              {t("add")}
            </Button>
          ) : null}
        </div>
      ) : null}

      {activities.length === 0 ? (
        !draft ? (
          <p className="text-body-sm leading-body-sm tracking-body-sm text-metal">
            {t("empty")}
          </p>
        ) : null
      ) : (
        // Tabla-resumen: una fila por actividad (clic para editar en el panel).
        <div className="overflow-x-auto rounded-card border border-stone">
          <table className="w-full border-collapse text-body-sm">
            <thead>
              <tr className="border-b border-stone bg-ash text-left text-caption leading-caption text-carbon">
                <th className="px-12 py-8 font-medium">{t("table.name")}</th>
                <th className="px-12 py-8 font-medium">{t("table.purpose")}</th>
                <th className="px-12 py-8 font-medium">{t("table.legalBasis")}</th>
                <th className="px-12 py-8 text-center font-medium">{t("table.sensitive")}</th>
                <th className="px-12 py-8 text-center font-medium">{t("table.intl")}</th>
                <th className="px-12 py-8 text-center font-medium">{t("table.status")}</th>
                <th className="px-12 py-8" aria-label={t("table.actions")} />
              </tr>
            </thead>
            <tbody>
              {activities.map((activity, index) => {
                const complete = isActivityComplete(activity);
                return (
                  <tr
                    key={index}
                    onClick={() => startEdit(index)}
                    className={cn(
                      "cursor-pointer border-b border-ash last:border-b-0 hover:bg-ash",
                      editingIndex === index && "bg-ash",
                    )}
                  >
                    <td className="px-12 py-8 align-top font-medium text-ink">
                      {activity.name || t("table.untitled")}
                    </td>
                    <td className="px-12 py-8 align-top text-carbon">
                      {activity.purpose}
                    </td>
                    <td className="px-12 py-8 align-top text-carbon">{tLegal(activity.legalBasis)}</td>
                    <td className="px-12 py-8 text-center align-top">
                      {activity.isSensitive ? (
                        <StatusBadge variant="warning">{t("table.yes")}</StatusBadge>
                      ) : (
                        <span className="text-metal">—</span>
                      )}
                    </td>
                    <td className="px-12 py-8 text-center align-top">
                      {activity.intlTransfer ? (
                        <StatusBadge variant="active">{t("table.yes")}</StatusBadge>
                      ) : (
                        <span className="text-metal">—</span>
                      )}
                    </td>
                    <td className="px-12 py-8 text-center align-top">
                      <span
                        title={complete ? t("table.complete") : t("table.incomplete")}
                        className={cn(
                          "inline-flex h-16 w-16 items-center justify-center",
                        )}
                      >
                        {complete ? (
                          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="text-success-green" aria-hidden="true">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        ) : (
                          <span className="h-8 w-8 rounded-full bg-warning-yellow" aria-hidden="true" />
                        )}
                      </span>
                    </td>
                    <td className="px-12 py-8 text-right align-top">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          remove(index);
                        }}
                        title={t("remove")}
                        aria-label={t("remove")}
                        className="cursor-pointer rounded-tags px-6 py-4 text-caption text-danger-red transition-colors hover:bg-danger-red/10"
                      >
                        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 6h18" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {draft ? (
        <Card className="flex flex-col gap-12">
          <div className="grid gap-12 sm:grid-cols-2">
            <Field label={t("fields.area")} htmlFor="rat-area">
              <Input
                id="rat-area"
                value={draft.area}
                onChange={(event) => setDraft({ ...draft, area: event.target.value })}
              />
            </Field>
            <Field label={t("fields.name")} htmlFor="rat-name">
              <Input
                id="rat-name"
                value={draft.name}
                placeholder={t("fields.namePlaceholder")}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
            </Field>
          </div>

          <Field label={t("fields.purpose")} htmlFor="rat-purpose">
            <Textarea
              id="rat-purpose"
              rows={2}
              value={draft.purpose}
              placeholder={t("fields.purposePlaceholder")}
              onChange={(event) => setDraft({ ...draft, purpose: event.target.value })}
            />
          </Field>

          <Field label={t("fields.legalBasis")}>
            {/* Select que despliega tarjetas: cerrado muestra la elegida (título
                + descripción); abierto lista todas para elegir. */}
            <div className="relative" ref={legalRef}>
              <button
                type="button"
                onClick={() => setLegalOpen((open) => !open)}
                aria-expanded={legalOpen}
                className="flex w-full items-start justify-between gap-8 rounded-inputs border border-slate bg-white px-12 py-8 text-left transition-colors hover:bg-ash"
              >
                <span className="min-w-0">
                  <span className="block text-body-sm font-medium text-ink">
                    {tLegal(draft.legalBasis)}
                  </span>
                  <span className="mt-[2px] block text-caption leading-caption text-carbon">
                    {t(`legalBasesHelp.${draft.legalBasis}`)}
                  </span>
                </span>
                <svg
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={cn(
                    "mt-[2px] shrink-0 text-carbon transition-transform",
                    legalOpen && "rotate-180",
                  )}
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {legalOpen ? (
                <div className="absolute z-10 mt-4 flex w-full flex-col gap-2 rounded-tags border border-stone bg-white p-4 shadow-[rgba(28,40,64,0.1)_0px_12px_32px_-12px]">
                  {LEGAL_BASES.map((basis) => {
                    const selected = draft.legalBasis === basis;
                    return (
                      <button
                        key={basis}
                        type="button"
                        onClick={() => {
                          setDraft({ ...draft, legalBasis: basis });
                          setLegalOpen(false);
                        }}
                        className={cn(
                          "cursor-pointer rounded-tags px-12 py-8 text-left transition-colors",
                          selected ? "bg-ash" : "hover:bg-ash",
                        )}
                      >
                        <span className="block text-body-sm font-medium text-ink">
                          {tLegal(basis)}
                        </span>
                        <span className="mt-[2px] block text-caption leading-caption text-carbon">
                          {t(`legalBasesHelp.${basis}`)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </Field>

          <div className="grid gap-12 sm:grid-cols-2">
            <Field
              label={t("fields.dataCategories")}
              htmlFor="rat-data-categories"
              hint={t("fields.dataCategoriesHint")}
            >
              <Input
                id="rat-data-categories"
                value={draft.dataCategories.join(", ")}
                placeholder={t("fields.dataCategoriesPlaceholder")}
                onChange={(event) =>
                  setDraft({ ...draft, dataCategories: splitList(event.target.value) })
                }
              />
            </Field>
            <Field
              label={t("fields.dataSubjects")}
              htmlFor="rat-data-subjects"
              hint={t("fields.dataSubjectsHint")}
            >
              <Input
                id="rat-data-subjects"
                value={draft.dataSubjects.join(", ")}
                placeholder={t("fields.dataSubjectsPlaceholder")}
                onChange={(event) =>
                  setDraft({ ...draft, dataSubjects: splitList(event.target.value) })
                }
              />
            </Field>
          </div>

          <Field label={t("fields.source")} htmlFor="rat-source" hint={t("fields.sourceHint")}>
            <Input
              id="rat-source"
              value={draft.source}
              placeholder={t("fields.sourcePlaceholder")}
              onChange={(event) => setDraft({ ...draft, source: event.target.value })}
            />
          </Field>

          <Field
            label={t("fields.recipients")}
            htmlFor="rat-recipients"
            hint={t("fields.recipientsHint")}
          >
            <Input
              id="rat-recipients"
              value={draft.recipients.join(", ")}
              placeholder={t("fields.recipientsPlaceholder")}
              onChange={(event) =>
                setDraft({ ...draft, recipients: splitList(event.target.value) })
              }
            />
          </Field>

          <Field
            label={t("fields.processors")}
            htmlFor="rat-processors"
            hint={t("fields.processorsHint")}
          >
            <Input
              id="rat-processors"
              value={draft.processors.join(", ")}
              placeholder={t("fields.processorsPlaceholder")}
              onChange={(event) =>
                setDraft({ ...draft, processors: splitList(event.target.value) })
              }
            />
          </Field>

          <label className="flex items-center gap-8 text-body-sm text-ink">
            <input
              type="checkbox"
              className="h-16 w-16 shrink-0 rounded-[4px] border-slate accent-ink"
              checked={draft.intlTransfer}
              onChange={(event) =>
                setDraft({ ...draft, intlTransfer: event.target.checked })
              }
            />
            {t("fields.intlTransfer")}
          </label>

          <Field
            label={t("fields.intlCountries")}
            hint={t("fields.intlCountriesHint")}
          >
            <CountryMultiSelect
              value={draft.intlCountries}
              disabled={!draft.intlTransfer}
              onChange={(intlCountries) => setDraft({ ...draft, intlCountries })}
            />
          </Field>

          <Field label={t("fields.retention")} htmlFor="rat-retention">
            <Input
              id="rat-retention"
              value={draft.retention}
              onChange={(event) => setDraft({ ...draft, retention: event.target.value })}
            />
          </Field>

          <Field
            label={t("fields.securityMeasures")}
            htmlFor="rat-security-measures"
            hint={t("fields.securityMeasuresHint")}
          >
            <Input
              id="rat-security-measures"
              value={draft.securityMeasures.join(", ")}
              onChange={(event) =>
                setDraft({ ...draft, securityMeasures: splitList(event.target.value) })
              }
            />
          </Field>

          <label className="flex items-center gap-8 text-body-sm text-ink">
            <input
              type="checkbox"
              className="h-16 w-16 shrink-0 rounded-[4px] border-slate accent-ink"
              checked={draft.isSensitive}
              onChange={(event) => setDraft({ ...draft, isSensitive: event.target.checked })}
            />
            {t("fields.isSensitive")}
          </label>

          <Field label={t("fields.notes")} htmlFor="rat-notes">
            <Textarea
              id="rat-notes"
              rows={2}
              value={draft.notes ?? ""}
              placeholder={t("fields.notesPlaceholder")}
              onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
            />
          </Field>

          {error ? (
            <p role="alert" className="text-caption leading-caption text-danger-red">
              {t("errors.validation")}
            </p>
          ) : null}

          <div className="flex items-center gap-8">
            <Button onClick={save}>{t("save")}</Button>
            <Button variant="ghost" onClick={cancel}>
              {t("cancel")}
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
