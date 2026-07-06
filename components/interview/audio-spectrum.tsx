"use client";

import { useEffect, useRef } from "react";

/**
 * Espectro de audio en vivo (Fase 3): dibuja barras de frecuencia a partir del
 * AnalyserNode del hook de grabación, para dejar en evidencia que se está
 * escuchando la reunión. Solo anima mientras `active`. Sin audio → barras
 * planas. Puramente visual.
 */
export function AudioSpectrum({
  getAnalyser,
  active,
  className,
}: {
  getAnalyser: () => AnalyserNode | null;
  active: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const analyser = getAnalyser();
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);
      if (!analyser) return;
      const bins = analyser.frequencyBinCount;
      const data = new Uint8Array(bins);
      analyser.getByteFrequencyData(data);
      const bars = Math.min(bins, 40);
      const gap = 2;
      const barWidth = (width - gap * (bars - 1)) / bars;
      for (let i = 0; i < bars; i++) {
        const value = data[Math.floor((i / bars) * bins)] / 255; // 0..1
        const barHeight = Math.max(2, value * height);
        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;
        // Rojo de la paleta (indica grabación).
        ctx.fillStyle = "#772322";
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [active, getAnalyser]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={32}
      className={className}
      aria-hidden="true"
    />
  );
}
