"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button, Card } from "@/components/ui";
import { extractDiagnosisFromTranscript } from "@/lib/actions/interview";
import type { ExtractionResult } from "@/lib/llm/extract-diagnosis";

/**
 * Panel CONTROLADO para importar una transcripción DESDE UN ARCHIVO de texto y
 * disparar la extracción del LLM. El disparador es un icono en la barra de
 * acciones del DiagnosisManager; se monta SOLO cuando está abierto y se cierra
 * vía `onClose`. Entrega la extracción validada por `onExtracted`; la revisión
 * la hace `ExtractionReview`.
 */

type TranscriptImportError = "llm_disabled" | "llm_failed" | "generic" | "empty";

export function TranscriptImport({
  sessionId,
  onExtracted,
  onClose,
}: {
  sessionId: string;
  onExtracted: (result: ExtractionResult) => void;
  onClose: () => void;
}) {
  const t = useTranslations("app.diagnosis.transcript");

  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<TranscriptImportError | null>(null);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const content = await file.text();
      if (!content.trim()) {
        setError("empty");
        setText("");
        setFileName(null);
        return;
      }
      setText(content);
      setFileName(file.name);
    } catch {
      setError("generic");
      setText("");
      setFileName(null);
    }
  }

  function handleAnalyze() {
    if (!text.trim() || pending) return;
    setError(null);
    startTransition(async () => {
      const result = await extractDiagnosisFromTranscript(sessionId, text);
      if (result.ok) {
        onExtracted(result.extraction);
        onClose();
      } else {
        setError(
          result.error === "llm_disabled" || result.error === "llm_failed"
            ? result.error
            : "generic",
        );
      }
    });
  }

  return (
    <Card className="flex flex-col gap-12">
      <h2 className="text-body-sm font-semibold text-ink">{t("panelTitle")}</h2>
      <p className="text-caption leading-caption text-carbon">{t("privacyNote")}</p>

      {/* Selector de archivo de texto (.txt/.vtt/.srt/.md). */}
      <label className="flex flex-wrap items-center gap-8">
        <span className="inline-flex cursor-pointer items-center gap-6 rounded-buttons border border-slate bg-white px-12 py-8 text-body-sm text-ink transition-colors hover:bg-ash">
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="M17 8l-5-5-5 5" />
            <path d="M12 3v12" />
          </svg>
          {t("chooseFile")}
          <input
            type="file"
            accept=".txt,.vtt,.srt,.md,text/plain"
            onChange={handleFile}
            disabled={pending}
            className="hidden"
          />
        </span>
        {fileName ? (
          <span className="text-caption leading-caption text-carbon">{fileName}</span>
        ) : (
          <span className="text-caption leading-caption text-metal">{t("fileHint")}</span>
        )}
      </label>

      {error ? (
        <p role="alert" className="text-caption leading-caption text-danger-red">
          {t(`errors.${error}`)}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-8">
        <Button onClick={handleAnalyze} disabled={pending || !text.trim()}>
          {pending ? t("analyzing") : t("analyze")}
        </Button>
        <Button variant="ghost" onClick={onClose} disabled={pending}>
          {t("cancel")}
        </Button>
      </div>
    </Card>
  );
}
