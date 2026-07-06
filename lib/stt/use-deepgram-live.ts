"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { grantDeepgramToken } from "@/lib/actions/interview";

/**
 * Escucha activa por voz (Fase 3). Captura el micrófono (consultor) y, si se
 * comparte, el audio del PC (la empresa en reuniones online), los MEZCLA en una
 * sola pista y abre UN WebSocket a Deepgram. La transcripción es un solo hilo
 * de texto (sin diferenciar hablantes) — suficiente para el análisis del
 * diagnóstico, que usa el contenido, no quién lo dijo.
 *
 * WebSocket nativo con auth por subprotocolo ["bearer", <token efímero>] (en el
 * navegador no se pueden enviar headers). El secreto nunca sale al cliente.
 * No testeable con audio real en CI; la prueba en vivo la hace el usuario.
 */

export type SttStatus = "idle" | "connecting" | "listening" | "paused" | "error";
export type SttError = "stt_disabled" | "mic_denied" | "generic";

interface UseDeepgramLiveArgs {
  onInterim?: (text: string) => void;
  onFinal?: (text: string) => void;
  onError?: (error: SttError) => void;
}

const DEEPGRAM_URL = `wss://api.deepgram.com/v1/listen?${new URLSearchParams({
  model: "nova-2",
  language: "es",
  smart_format: "true",
  interim_results: "true",
}).toString()}`;

// MediaRecorder no soporta el mismo mimeType en todos los navegadores.
function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}

export function useDeepgramLive({ onInterim, onFinal, onError }: UseDeepgramLiveArgs) {
  const [status, setStatus] = useState<SttStatus>("idle");

  const socketRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null); // pista mezclada (al recorder)
  const micStreamRef = useRef<MediaStream | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stoppingRef = useRef(false);

  const cbRef = useRef({ onInterim, onFinal, onError });
  useEffect(() => {
    cbRef.current = { onInterim, onFinal, onError };
  }, [onInterim, onFinal, onError]);

  const cleanup = useCallback(() => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
    try {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    } catch {
      /* noop */
    }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    displayStreamRef.current?.getTracks().forEach((t) => t.stop());
    displayStreamRef.current = null;
    analyserRef.current = null;
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    const ws = socketRef.current;
    socketRef.current = null;
    if (ws) {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "CloseStream" }));
        }
        ws.close();
      } catch {
        /* noop */
      }
    }
  }, []);

  const stop = useCallback(() => {
    stoppingRef.current = true;
    cleanup();
    setStatus("idle");
  }, [cleanup]);

  const pause = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state === "recording") {
      try {
        recorder.pause();
      } catch {
        /* noop */
      }
      setStatus("paused");
    }
  }, []);

  const resume = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state === "paused") {
      try {
        recorder.resume();
      } catch {
        /* noop */
      }
      setStatus("listening");
    }
  }, []);

  const finalize = useCallback(() => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: "Finalize" }));
      } catch {
        /* noop */
      }
    }
  }, []);

  const start = useCallback(
    async () => {
      stoppingRef.current = false;
      setStatus("connecting");
      const fail = (error: SttError) => {
        cleanup();
        setStatus("error");
        cbRef.current.onError?.(error);
      };

      // 1) Token efímero.
      const granted = await grantDeepgramToken();
      if (!granted.ok) return fail("stt_disabled");

      // 2) Micrófono (obligatorio) con cancelación de eco.
      let mic: MediaStream;
      try {
        mic = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch {
        return fail("mic_denied");
      }
      micStreamRef.current = mic;

      // 3) Audio del PC (compartir pestaña/pantalla con audio). No se detiene la
      // pista de video (hacerlo corta toda la captura en Chrome); se ignora.
      let display: MediaStream | null = null;
      try {
        display = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        displayStreamRef.current = display;
        if (display.getAudioTracks().length === 0) display = null;
      } catch {
        display = null;
      }

      // 4) Mezcla mic + audio del PC en UNA pista para el recorder/STT.
      let mixed: MediaStream;
      try {
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        if (ctx.state === "suspended") await ctx.resume().catch(() => {});
        const dest = ctx.createMediaStreamDestination();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyserRef.current = analyser;
        const micSrc = ctx.createMediaStreamSource(mic);
        micSrc.connect(dest);
        micSrc.connect(analyser);
        if (display && display.getAudioTracks().length > 0) {
          const displaySrc = ctx.createMediaStreamSource(
            new MediaStream(display.getAudioTracks()),
          );
          displaySrc.connect(dest);
          displaySrc.connect(analyser);
        }
        mixed = dest.stream;
      } catch {
        return fail("generic");
      }
      const stream = mixed;
      streamRef.current = stream;

      // 5) WebSocket a Deepgram (auth por subprotocolo bearer).
      let ws: WebSocket;
      try {
        ws = new WebSocket(DEEPGRAM_URL, ["bearer", granted.token]);
      } catch {
        return fail("generic");
      }
      socketRef.current = ws;

      ws.onopen = () => {
        if (socketRef.current !== ws) return;
        const mimeType = pickMimeType();
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        recorderRef.current = recorder;
        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(event.data);
          }
        };
        recorder.start(250);
        keepAliveRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "KeepAlive" }));
          }
        }, 8000);
        setStatus("listening");
      };

      ws.onmessage = (event) => {
        let data: {
          type?: string;
          is_final?: boolean;
          channel?: { alternatives?: Array<{ transcript?: string }> };
        };
        try {
          data = JSON.parse(event.data as string);
        } catch {
          return;
        }
        if (data.type !== "Results") return;
        const plain = data.channel?.alternatives?.[0]?.transcript?.trim() ?? "";
        if (!plain) return;
        if (data.is_final) cbRef.current.onFinal?.(plain);
        else cbRef.current.onInterim?.(plain);
      };

      ws.onerror = () => {
        if (!stoppingRef.current) fail("generic");
      };

      ws.onclose = () => {
        if (!stoppingRef.current && socketRef.current === ws) fail("generic");
      };
    },
    [cleanup],
  );

  useEffect(() => cleanup, [cleanup]);

  const getAnalyser = useCallback(() => analyserRef.current, []);

  return { status, start, stop, pause, resume, finalize, getAnalyser };
}
