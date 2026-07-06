"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button, Card, StatusBadge, Textarea, cn } from "@/components/ui";
import {
  extractDiagnosisFromTranscript,
  recordListeningConsent,
} from "@/lib/actions/interview";
import {
  useDeepgramLive,
  type SttError,
  type SttSource,
} from "@/lib/stt/use-deepgram-live";
import { buildQuestionQueue, computeGuideCoverage, type GuideDomain } from "@/lib/interview/guide";
import { ratActivitySchema, type RatActivity } from "@/lib/interview/rat-schema";
import type { ExtractionResult } from "@/lib/llm/extract-diagnosis";
import { buildRatActivity } from "./extraction-review";

/**
 * Panel "Entrevista en vivo" (spec `2026-07-06-ai-live-interviewer-design.md`,
 * Fase 1 Tarea 2): co-piloto de escucha activa — el consultor conduce la
 * conversación y va pegando/escribiendo lo conversado por tramos; al analizar
 * un tramo, la IA (`extractDiagnosisFromTranscript`, misma extracción
 * exhaustiva que `TranscriptImport`) revisa el TRANSCRIPT ACUMULADO completo
 * y:
 * - **auto-integra** cumplimiento y alertas al borrador vía los callbacks del
 *   manager (`onAcceptCompliance`) — idempotente porque cada fill pisa el
 *   mismo índice de criterio, re-analizar no duplica nada;
 * - **ofrece** el RAT detectado para aceptar (nunca se auto-agrega, para no
 *   duplicar actividades), dedupeado por `name` contra lo ya pendiente Y lo
 *   ya aceptado en la sesión.
 * La **cola de preguntas** (`buildQuestionQueue`) y la **cobertura**
 * (`computeGuideCoverage`) se recalculan en cada render a partir de
 * `compliance`, que llega por props desde el estado `answers` del manager —
 * por eso tachar una pregunta es automático apenas el fill entra al borrador,
 * sin lógica adicional acá.
 */

type LiveInterviewError = "llm_disabled" | "llm_failed" | "generic";

export function LiveInterviewPanel({
  sessionId,
  guide,
  compliance,
  onAcceptCompliance,
  onAcceptRat,
}: {
  sessionId: string;
  guide: GuideDomain[];
  compliance: Record<string, string[]>;
  onAcceptCompliance: (
    controlCode: string,
    index: number,
    answer: "yes" | "partial" | "no" | "flagged",
  ) => void;
  onAcceptRat: (activity: RatActivity) => void;
}) {
  const t = useTranslations("app.diagnosis.live");

  const [transcript, setTranscript] = useState("");
  const [chunk, setChunk] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<LiveInterviewError | null>(null);
  const [pendingRat, setPendingRat] = useState<RatActivity[]>([]);

  // Escucha activa por voz (Fase 3).
  const [consent, setConsent] = useState(false);
  const [source, setSource] = useState<SttSource>("mic");
  const [interim, setInterim] = useState("");
  const [sttError, setSttError] = useState<SttError | null>(null);
  // Ref con el transcript vigente para el análisis debounced (closure estable).
  const transcriptRef = useRef("");
  transcriptRef.current = transcript;
  const analyzeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queue = useMemo(() => buildQuestionQueue(guide, compliance), [guide, compliance]);
  const coverage = useMemo(() => computeGuideCoverage(guide, compliance), [guide, compliance]);
  // "Siguiente" = primera pregunta no resuelta (las 'clarify' van arriba, así
  // que apunta a lo que hay que insistir antes de cerrar la reunión).
  const nextIndex = queue.findIndex((question) => question.status !== "resolved");

  function integrateExtraction(extraction: ExtractionResult) {
    for (const suggestion of extraction.compliance) {
      onAcceptCompliance(suggestion.controlCode, suggestion.criterionIndex, suggestion.answer);
    }
    for (const alert of extraction.alerts) {
      onAcceptCompliance(alert.controlCode, alert.criterionIndex, "flagged");
    }

    if (extraction.rat.length === 0) return;
    setPendingRat((current) => {
      const known = new Set(current.map((activity) => activity.name.trim().toLowerCase()));
      const additions: RatActivity[] = [];
      for (const suggestion of extraction.rat) {
        const activity = buildRatActivity(suggestion.fields);
        const parsed = ratActivitySchema.safeParse(activity);
        if (!parsed.success) continue;
        const key = parsed.data.name.trim().toLowerCase();
        if (known.has(key)) continue;
        known.add(key);
        additions.push(parsed.data);
      }
      return additions.length > 0 ? [...current, ...additions] : current;
    });
  }

  function handleAnalyze() {
    if (!chunk.trim() || pending) return;
    setError(null);
    const nextTranscript = transcript ? `${transcript}\n${chunk.trim()}` : chunk.trim();
    startTransition(async () => {
      const result = await extractDiagnosisFromTranscript(sessionId, nextTranscript);
      if (result.ok) {
        setTranscript(nextTranscript);
        setChunk("");
        integrateExtraction(result.extraction);
      } else {
        setError(
          result.error === "llm_disabled" || result.error === "llm_failed"
            ? result.error
            : "generic",
        );
      }
    });
  }

  function handleAcceptActivity(activity: RatActivity) {
    onAcceptRat(activity);
    setPendingRat((current) =>
      current.filter((candidate) => candidate.name !== activity.name),
    );
  }

  // Analiza el transcript acumulado vigente (usado por la escucha por voz). La
  // extracción es exhaustiva e idempotente, así que re-analizar el acumulado no
  // duplica nada; los fills entran al borrador vía integrateExtraction.
  function analyzeAccumulated() {
    const full = transcriptRef.current.trim();
    if (!full || pending) return;
    startTransition(async () => {
      const result = await extractDiagnosisFromTranscript(sessionId, full);
      if (result.ok) integrateExtraction(result.extraction);
    });
  }

  // Debounce: tras cada tramo final de voz, se reprograma el análisis; así se
  // acota el costo/latencia (no se analiza en cada palabra).
  function scheduleAnalyze() {
    if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
    analyzeTimerRef.current = setTimeout(() => analyzeAccumulated(), 10000);
  }

  const stt = useDeepgramLive({
    onInterim: (text) => setInterim(text),
    onFinal: (text) => {
      setInterim("");
      setTranscript((prev) => (prev ? `${prev}\n${text}` : text));
      scheduleAnalyze();
    },
    onError: (err) => setSttError(err),
  });

  async function handleStartListening() {
    if (!consent) return;
    setSttError(null);
    // Registra el consentimiento (auditable) antes de abrir el micrófono.
    await recordListeningConsent(sessionId);
    await stt.start(source);
  }

  function handleStopListening() {
    stt.stop();
    setInterim("");
    if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
    analyzeAccumulated(); // flush: analiza lo acumulado al detener
  }

  // Limpia el timer de análisis al desmontar.
  useEffect(() => {
    return () => {
      if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
    };
  }, []);

  const listening = stt.status === "listening";
  const connecting = stt.status === "connecting";

  return (
    <Card className="flex flex-col gap-20">
      <div>
        <h2 className="text-body-sm font-semibold text-ink">{t("title")}</h2>
        <p className="mt-4 text-caption leading-caption text-carbon">{t("subtitle")}</p>
      </div>

      {/* Escucha activa por voz (Fase 3): consentimiento + fuente + iniciar. */}
      <div className="flex flex-col gap-8 rounded-tags border border-stone bg-ash/40 p-12">
        <h3 className="text-caption font-medium leading-caption text-ink">
          {t("listening.title")}
        </h3>

        {!listening && !connecting ? (
          <>
            <label className="flex items-start gap-8 text-caption leading-caption text-carbon">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-[2px] cursor-pointer"
              />
              <span>{t("listening.consentText")}</span>
            </label>

            <div className="flex flex-wrap items-center gap-8">
              <div className="flex overflow-hidden rounded-tags border border-stone">
                {(["mic", "tab"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSource(s)}
                    className={cn(
                      "cursor-pointer px-12 py-4 text-caption leading-caption",
                      source === s ? "bg-ink text-white" : "bg-white text-carbon",
                    )}
                  >
                    {t(`listening.source_${s}`)}
                  </button>
                ))}
              </div>
              <Button onClick={handleStartListening} disabled={!consent}>
                {t("listening.start")}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-8">
            <StatusBadge variant={listening ? "positive" : "neutral"}>
              {connecting ? t("listening.connecting") : t("listening.listening")}
            </StatusBadge>
            <Button variant="secondary" onClick={handleStopListening}>
              {t("listening.stop")}
            </Button>
          </div>
        )}

        {interim ? (
          <p className="text-caption italic leading-caption text-metal">
            {t("listening.interimLabel")}: {interim}
          </p>
        ) : null}
        {sttError ? (
          <p role="alert" className="text-caption leading-caption text-danger-red">
            {t(`listening.errors.${sttError}`)}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-8">
        <Textarea
          value={chunk}
          onChange={(event) => setChunk(event.target.value)}
          placeholder={t("chunkPlaceholder")}
          disabled={pending}
          className="min-h-[120px]"
        />
        {error ? (
          <p role="alert" className="text-caption leading-caption text-danger-red">
            {t(`errors.${error}`)}
          </p>
        ) : null}
        <div>
          <Button onClick={handleAnalyze} disabled={pending || !chunk.trim()}>
            {pending ? t("analyzing") : t("analyze")}
          </Button>
        </div>
      </div>

      {transcript ? (
        <div>
          <h3 className="mb-8 text-caption font-medium leading-caption text-ink">
            {t("transcriptTitle")}
          </h3>
          <div className="max-h-[160px] overflow-y-auto rounded-tags bg-ash px-12 py-8">
            <p className="whitespace-pre-wrap text-caption leading-caption text-carbon">
              {transcript}
            </p>
          </div>
        </div>
      ) : null}

      <div>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-8">
          <h3 className="text-body-sm font-semibold text-ink">{t("queueTitle")}</h3>
          {coverage.uncovered.length === 0 ? (
            <StatusBadge variant="positive">{t("ready")}</StatusBadge>
          ) : (
            <StatusBadge variant="warning">
              {t("coverage", { n: coverage.uncovered.length, total: coverage.total })}
            </StatusBadge>
          )}
        </div>
        {/* Pregunta de apertura: siempre al tope, encuadra la conversación. No
            se tacha ni cuenta para la cobertura (no está ligada a un control). */}
        <div className="mb-8 flex items-baseline gap-8 rounded-tags bg-ash px-8 py-4">
          <StatusBadge variant="neutral">{t("openerLabel")}</StatusBadge>
          <span className="text-body-sm font-medium text-ink">{t("opener")}</span>
        </div>
        {queue.length === 0 ? (
          <p className="text-caption leading-caption text-carbon">{t("queueEmpty")}</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {queue.map((question, index) => (
              <li
                key={`${question.controlCode}-${index}`}
                className={cn(
                  "flex items-baseline gap-8 rounded-tags px-8 py-4",
                  index === nextIndex && "bg-ash",
                )}
              >
                {index === nextIndex ? (
                  <StatusBadge variant="neutral">{t("nextLabel")}</StatusBadge>
                ) : null}
                <span
                  className={cn(
                    "text-body-sm text-ink",
                    question.status === "resolved" && "text-metal line-through",
                    question.status === "clarify" && "text-warning-yellow",
                  )}
                >
                  {question.question}
                </span>
                {question.status === "resolved" ? (
                  <span className="shrink-0 text-caption leading-caption text-metal">
                    {t("answered")}
                  </span>
                ) : question.status === "clarify" ? (
                  <StatusBadge variant="warning">{t("clarify")}</StatusBadge>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {pendingRat.length > 0 ? (
        <div>
          <h3 className="mb-8 text-body-sm font-semibold text-ink">{t("ratSuggested")}</h3>
          <ul className="flex flex-col gap-8">
            {pendingRat.map((activity) => (
              <li key={activity.name}>
                <Card className="flex flex-wrap items-center justify-between gap-8 border-ink/10">
                  <div className="min-w-0">
                    <p className="text-caption font-medium leading-caption text-ink">
                      {activity.name}
                    </p>
                    <p className="text-caption leading-caption text-carbon">{activity.purpose}</p>
                  </div>
                  <Button onClick={() => handleAcceptActivity(activity)}>
                    {t("acceptActivity")}
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
