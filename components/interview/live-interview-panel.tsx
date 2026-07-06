"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import { Button, Card, StatusBadge, cn } from "@/components/ui";
import { AudioSpectrum } from "./audio-spectrum";
import {
  extractDiagnosisFromTranscript,
  recordListeningConsent,
} from "@/lib/actions/interview";
import { useDeepgramLive, type SttError } from "@/lib/stt/use-deepgram-live";
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

// Marca de separación que agrega cada checkpoint en el transcrito visible.
const CHECKPOINT_MARK = "———";

// Botones-icono de la grabadora (solo iconos, con tooltip por `title`).
const REC_BTN =
  "inline-flex h-40 w-40 shrink-0 cursor-pointer items-center justify-center " +
  "rounded-buttons border border-slate bg-white text-ink transition-colors " +
  "hover:bg-ash disabled:pointer-events-none disabled:opacity-50";
const REC_BTN_PRIMARY =
  "inline-flex h-40 w-40 shrink-0 cursor-pointer items-center justify-center " +
  "rounded-buttons border border-ink bg-ink text-white transition-colors " +
  "hover:bg-ink/90 disabled:pointer-events-none disabled:opacity-50";
// Botón principal de grabación: círculo rojo (grabar) / pausa mientras graba.
const REC_BTN_RECORD =
  "inline-flex h-40 w-40 shrink-0 cursor-pointer items-center justify-center " +
  "rounded-full bg-danger-red text-white transition-colors " +
  "hover:bg-danger-red/90 disabled:pointer-events-none disabled:opacity-50";

export function LiveInterviewPanel({
  sessionId,
  guide,
  compliance,
  onAcceptCompliance,
  onAcceptRat,
  toolbar,
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
  /** Toolbar del diagnóstico (estado + acciones), renderizado en este panel. */
  toolbar?: ReactNode;
}) {
  const t = useTranslations("app.diagnosis.live");

  const [transcript, setTranscript] = useState("");
  const [, startTransition] = useTransition();
  const [analysisError, setAnalysisError] = useState<LiveInterviewError | null>(null);
  const [pendingRat, setPendingRat] = useState<RatActivity[]>([]);

  // Escucha activa por voz (Fase 3).
  const [consent, setConsent] = useState(false);
  const [interim, setInterim] = useState("");
  const [sttError, setSttError] = useState<SttError | null>(null);
  // Siguiente mejor pregunta sugerida por la IA (guía; el consultor decide).
  const [suggested, setSuggested] = useState<ExtractionResult["nextQuestion"]>(null);
  // El análisis corre en paralelo al micrófono (no lo detiene).
  const [analyzing, setAnalyzing] = useState(false);
  // Ref con el transcript vigente para el análisis periódico (closure estable).
  const transcriptRef = useRef("");
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);
  const analyzingRef = useRef(false); // evita análisis solapados
  // Cola FIFO de análisis: cada clic "Analizar lo escuchado" encola el
  // transcrito hasta ese punto; se procesan en serie (uno a la vez) mientras el
  // micrófono sigue abierto. Si la conversación va más rápido que el análisis,
  // los pendientes se acumulan y se resuelven en orden.
  const analysisQueueRef = useRef<string[]>([]);
  const [queuedCount, setQueuedCount] = useState(0);

  const queue = useMemo(() => buildQuestionQueue(guide, compliance), [guide, compliance]);
  const coverage = useMemo(() => computeGuideCoverage(guide, compliance), [guide, compliance]);
  // Nombre de control por código, para mostrar la sugerencia de la IA con su tema.
  const controlNameByCode = useMemo(() => {
    const map = new Map<string, string>();
    for (const domain of guide) {
      for (const control of domain.controls) map.set(control.code, control.name);
    }
    return map;
  }, [guide]);

  // Temas resueltos (controles cubiertos): sección visible que crece a medida
  // que los análisis cierran temas.
  const resolvedControls = useMemo(() => {
    const uncovered = new Set(coverage.uncovered.map((u) => u.controlCode));
    const names: string[] = [];
    for (const domain of guide) {
      for (const control of domain.controls) {
        if (!uncovered.has(control.code)) names.push(control.name);
      }
    }
    return names;
  }, [guide, coverage]);

  // Cola de preguntas: solo lo pendiente (los resueltos van a "Temas resueltos").
  const pendingQueue = useMemo(
    () => queue.filter((q) => q.status !== "resolved"),
    [queue],
  );

  // Códigos de control ya resueltos → se excluyen del análisis para que la IA
  // solo procese lo pendiente (más rápido). Ref para usarlo en la cola async.
  const resolvedCodes = useMemo(() => {
    const uncovered = new Set(coverage.uncovered.map((u) => u.controlCode));
    const codes: string[] = [];
    for (const domain of guide) {
      for (const control of domain.controls) {
        if (!uncovered.has(control.code)) codes.push(control.code);
      }
    }
    return codes;
  }, [guide, coverage]);
  const resolvedCodesRef = useRef<string[]>([]);
  useEffect(() => {
    resolvedCodesRef.current = resolvedCodes;
  }, [resolvedCodes]);

  function integrateExtraction(extraction: ExtractionResult) {
    // Guía en vivo: la IA sugiere la siguiente mejor pregunta (o null si todo
    // quedó cubierto). No escribe nada al borrador; solo orienta al consultor.
    setSuggested(extraction.nextQuestion);

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

  function handleAcceptActivity(activity: RatActivity) {
    onAcceptRat(activity);
    setPendingRat((current) =>
      current.filter((candidate) => candidate.name !== activity.name),
    );
  }

  // Analiza el transcript acumulado vigente (usado por la escucha por voz). La
  // extracción es exhaustiva e idempotente, así que re-analizar el acumulado no
  // duplica nada; los fills entran al borrador vía integrateExtraction.
  // Procesa la cola de análisis uno por uno (serial). El micrófono sigue abierto
  // en paralelo; al terminar un análisis toma el siguiente de la cola.
  function drainAnalysisQueue() {
    if (analyzingRef.current) return;
    const next = analysisQueueRef.current.shift();
    setQueuedCount(analysisQueueRef.current.length);
    if (!next) return;
    analyzingRef.current = true;
    setAnalyzing(true);
    startTransition(async () => {
      // try/finally: pase lo que pase, se libera el lock y se sigue con la cola
      // (antes, si la extracción fallaba, la cola quedaba trabada).
      try {
        const result = await extractDiagnosisFromTranscript(
          sessionId,
          next,
          resolvedCodesRef.current,
        );
        if (result.ok) {
          setAnalysisError(null);
          integrateExtraction(result.extraction);
        } else {
          setAnalysisError(
            result.error === "llm_disabled" || result.error === "llm_failed"
              ? result.error
              : "generic",
          );
        }
      } catch (cause) {
        console.error("[live] análisis falló:", cause);
        setAnalysisError("generic");
      } finally {
        analyzingRef.current = false;
        setAnalyzing(false);
        drainAnalysisQueue(); // siguiente en cola
      }
    });
  }

  // Checkpoint: encola el transcrito acumulado hasta este punto (limpio de
  // marcas) y agrega una línea separadora al transcrito visible. La IA suma el
  // contexto para determinar qué resolver y qué falta preguntar; no detiene el
  // micrófono.
  function enqueueAnalysis() {
    const full = transcriptRef.current
      .split("\n")
      .filter((line) => line !== CHECKPOINT_MARK)
      .join("\n")
      .trim();
    if (!full) return;
    analysisQueueRef.current.push(full);
    setQueuedCount(analysisQueueRef.current.length);
    setTranscript((prev) => (prev ? `${prev}\n${CHECKPOINT_MARK}` : prev));
    drainAnalysisQueue();
  }

  const stt = useDeepgramLive({
    onInterim: (text) => setInterim(text),
    onFinal: (text) => {
      setInterim("");
      setTranscript((prev) => {
        // Tras un checkpoint empieza línea nueva; si no, continúa el párrafo.
        if (!prev) return text;
        if (prev.endsWith(CHECKPOINT_MARK)) return `${prev}\n${text}`;
        return `${prev} ${text}`;
      });
    },
    onError: (err) => setSttError(err),
  });

  // Mientras se escucha, un Finalize periódico (cada 4 s) fuerza que el audio en
  // buffer salga como tramo final, para que el transcrito en pantalla se
  // mantenga al día aunque el habla sea continua. El ANÁLISIS ya no es
  // automático: lo dispara el consultor con "Analizar lo escuchado".
  useEffect(() => {
    if (stt.status !== "listening") return;
    const id = setInterval(() => stt.finalize(), 4000);
    return () => clearInterval(id);
  }, [stt.status, stt.finalize]);

  async function handleStartListening() {
    if (!consent) return;
    setSttError(null);
    setElapsed(0); // reinicia el contador de tiempo de la grabación
    // Registra el consentimiento (auditable) antes de abrir el micrófono.
    await recordListeningConsent(sessionId);
    await stt.start();
  }

  function handleStopListening() {
    stt.stop();
    setInterim("");
    enqueueAnalysis(); // flush: encola un análisis del acumulado al detener
  }

  const listening = stt.status === "listening";
  const connecting = stt.status === "connecting";
  const paused = stt.status === "paused";
  const active = listening || connecting || paused; // sesión de grabación en curso

  // Contador de tiempo de grabación (mm:ss), corre mientras se escucha.
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (stt.status !== "listening") return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [stt.status]);
  const elapsedLabel = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(
    elapsed % 60,
  ).padStart(2, "0")}`;

  // Clips de transcripción (cada tramo final es una línea).
  const clips = useMemo(
    () => (transcript ? transcript.split("\n").filter(Boolean) : []),
    [transcript],
  );

  // Auto-scroll de la transcripción al final con cada tramo nuevo.
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = transcriptScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [transcript, interim]);

  // Bloquea cerrar/recargar la pestaña mientras se graba (no perder la reunión).
  useEffect(() => {
    if (stt.status !== "listening") return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [stt.status]);

  // Panel de transcripción en vivo (derecha). Altura fija con scroll interno
  // (no crece sin parar); se auto-desplaza al final con cada tramo nuevo.
  const transcriptView = (
    <div className="flex">
      <div
        ref={transcriptScrollRef}
        className="h-[260px] w-full overflow-y-auto rounded-tags bg-ash px-12 py-8"
      >
        {clips.length === 0 && !interim ? (
          <p className="text-caption leading-caption text-carbon">
            {t("listening.waiting")}
          </p>
        ) : null}
        <ul className="flex flex-col gap-4">
          {clips.map((clip, index) =>
            clip === CHECKPOINT_MARK ? (
              <li key={index} className="py-2">
                <hr className="border-stone" />
              </li>
            ) : (
              <li key={index} className="text-caption leading-caption text-carbon">
                {clip}
              </li>
            ),
          )}
        </ul>
        {interim ? (
          <p className="mt-4 text-caption italic leading-caption text-metal">
            {interim}
          </p>
        ) : null}
      </div>
    </div>
  );

  // Temas resueltos (ancho completo).
  const resolvedView =
    resolvedControls.length > 0 ? (
      <div>
        <h3 className="mb-8 text-body-sm font-semibold text-ink">
          {t("resolvedTitle")} ({resolvedControls.length})
        </h3>
        <ul className="flex flex-col gap-4">
          {resolvedControls.map((name) => (
            <li
              key={name}
              className="flex items-baseline gap-8 rounded-tags bg-ash px-8 py-4"
            >
              <StatusBadge variant="positive" className="shrink-0">
                {t("answered")}
              </StatusBadge>
              <span className="text-body-sm text-metal line-through">{name}</span>
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  // Siguiente mejor pregunta sugerida por la IA (guía; el consultor decide).
  const suggestedView = suggested ? (
    <div className="rounded-tags border border-focus-blue bg-focus-blue/5 px-12 py-8">
      <div className="mb-4 flex items-center gap-8">
        <StatusBadge variant="positive">{t("suggestedLabel")}</StatusBadge>
        {controlNameByCode.get(suggested.controlCode) ? (
          <span className="text-caption leading-caption text-carbon">
            {controlNameByCode.get(suggested.controlCode)}
          </span>
        ) : null}
      </div>
      <p className="text-body-sm font-semibold text-ink">{suggested.question}</p>
      {suggested.reason ? (
        <p className="mt-4 text-caption leading-caption text-carbon">
          {suggested.reason}
        </p>
      ) : null}
    </div>
  ) : null;

  // Preguntas pendientes agrupadas por objetivo (dominio), preservando orden.
  const questionGroups: { domain: string; items: typeof pendingQueue }[] = [];
  const groupIndex = new Map<string, number>();
  for (const question of pendingQueue) {
    let i = groupIndex.get(question.domainName);
    if (i === undefined) {
      i = questionGroups.length;
      groupIndex.set(question.domainName, i);
      questionGroups.push({ domain: question.domainName, items: [] });
    }
    questionGroups[i]!.items.push(question);
  }

  // Preguntas a cubrir (ancho completo, agrupadas por objetivo).
  const questionsView = (
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
      {/* Pregunta de apertura: encuadra la conversación. */}
      <div className="mb-12 flex items-start gap-8 rounded-tags bg-ash px-12 py-6">
        <StatusBadge variant="neutral" className="mt-[1px] shrink-0">
          {t("openerLabel")}
        </StatusBadge>
        <span className="text-caption font-medium leading-caption text-ink">
          {t("opener")}
        </span>
      </div>
      {pendingQueue.length === 0 ? (
        <p className="text-caption leading-caption text-carbon">{t("queueEmpty")}</p>
      ) : (
        <div className="flex flex-col gap-12">
          {questionGroups.map((group, groupIdx) => (
            <div key={group.domain}>
              <h4 className="mb-2 text-[10px] font-semibold uppercase leading-[1.4] tracking-[0.4px] text-metal">
                {group.domain}
              </h4>
              <ul className="flex flex-col">
                {group.items.map((question, itemIdx) => {
                  const isNext = groupIdx === 0 && itemIdx === 0;
                  return (
                    <li
                      key={`${question.controlCode}-${itemIdx}`}
                      className={cn(
                        "flex items-start justify-between gap-8 rounded-tags px-8 py-[5px]",
                        isNext && "bg-ash",
                      )}
                    >
                      <div className="flex min-w-0 items-start gap-6">
                        {isNext ? (
                          <StatusBadge variant="neutral" className="mt-[1px] shrink-0">
                            {t("nextLabel")}
                          </StatusBadge>
                        ) : null}
                        <span className="text-caption leading-caption text-carbon">
                          {question.question}
                        </span>
                      </div>
                      {question.status === "clarify" ? (
                        <StatusBadge variant="warning" className="mt-[1px] shrink-0">
                          {t("clarify")}
                        </StatusBadge>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Card className="flex flex-col gap-20">
      {toolbar ? (
        <div className="border-b border-stone pb-16">{toolbar}</div>
      ) : null}

      <div>
        <h2 className="text-body-sm font-semibold text-ink">{t("title")}</h2>
        <p className="mt-4 text-caption leading-caption text-carbon">{t("subtitle")}</p>
      </div>

      {/* Grabadora (izquierda) + transcripción (derecha); preguntas full-width
          abajo. El layout se mantiene igual esté grabando o no. */}
      <div className="grid gap-16 md:grid-cols-2">
        {/* Recuadro grabadora: mismo layout en reposo y grabando. */}
        <div className="flex flex-col gap-12 rounded-tags border border-stone bg-white p-16">
          <label className="flex items-start gap-8 text-caption leading-caption text-carbon">
            <input
              type="checkbox"
              checked={consent}
              disabled={active}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-[2px] cursor-pointer"
            />
            <span>{t("listening.consentText")}</span>
          </label>

          <div className="flex flex-wrap items-center gap-12">
            {/* Contador (00:00 en reposo). */}
            <span className="text-heading-sm font-medium tabular-nums leading-none text-ink">
              {elapsedLabel}
            </span>
            {/* Espectro de audio (plano en reposo/pausa, animado al grabar). */}
            <AudioSpectrum
              getAnalyser={stt.getAnalyser}
              active={listening}
              className="h-32 w-[160px] max-w-full"
            />

            {/* Controles: círculo rojo (grabar) ↔ pausa · ✓ checkpoint · ■ detener. */}
            <div className="ml-auto flex items-center gap-8">
              <button
                type="button"
                onClick={
                  listening
                    ? stt.pause
                    : paused
                      ? stt.resume
                      : handleStartListening
                }
                disabled={connecting || (!active && !consent)}
                title={
                  listening
                    ? t("listening.pause")
                    : paused
                      ? t("listening.resume")
                      : t("listening.start")
                }
                aria-label={
                  listening
                    ? t("listening.pause")
                    : paused
                      ? t("listening.resume")
                      : t("listening.start")
                }
                className={cn(REC_BTN_RECORD, listening && "animate-pulse")}
              >
                {listening ? (
                  // Pausa (dos barras).
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                ) : (
                  // Círculo (grabar / reanudar).
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <circle cx="12" cy="12" r="7" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={enqueueAnalysis}
                disabled={!listening || !transcript.trim()}
                title={t("listening.checkpoint")}
                aria-label={t("listening.checkpoint")}
                className={REC_BTN_PRIMARY}
              >
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleStopListening}
                disabled={!active}
                title={t("listening.stop")}
                aria-label={t("listening.stop")}
                className={REC_BTN}
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            </div>
          </div>

          {analyzing || queuedCount > 0 ? (
            <p className="text-caption leading-caption text-carbon">
              {t("listening.analyzingHeard")}
              {queuedCount > 0 ? ` · ${t("listening.queued", { n: queuedCount })}` : ""}
            </p>
          ) : null}

          {analysisError ? (
            <p role="alert" className="text-caption leading-caption text-danger-red">
              {t(`errors.${analysisError}`)}
            </p>
          ) : null}
          {sttError ? (
            <p role="alert" className="text-caption leading-caption text-danger-red">
              {t(`listening.errors.${sttError}`)}
            </p>
          ) : null}
        </div>

        {transcriptView}
      </div>

      {suggestedView}
      {resolvedView}
      {questionsView}

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
