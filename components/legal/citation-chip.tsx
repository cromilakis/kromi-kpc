"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { getCitation } from "@/lib/legal/citations";

/**
 * Chip de cita legal (mejora 2026-07-21): las referencias a artículos/normas
 * dejan de ser texto muerto — al tocarlas se abre un panel con el nombre
 * completo de la norma, un resumen referencial y el link al texto oficial
 * (Ley Chile/BCN u organismo) en pestaña nueva.
 *
 * Si la referencia no está en el catálogo de citas, degrada al chip estático
 * de siempre. Panel accesible: botón con aria-expanded, cierre con Escape y
 * clic fuera.
 */
export function CitationChip({ reference }: { reference: string }) {
  const t = useTranslations("common.citation");
  const citation = getCitation(reference);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  if (!citation) {
    return (
      <span className="rounded-tags bg-ash px-8 py-[2px] text-caption font-medium text-carbon">
        {reference}
      </span>
    );
  }

  return (
    <span ref={wrapRef} className="relative inline-block">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex cursor-pointer items-center gap-4 rounded-tags bg-ash px-8 py-[2px] text-caption font-medium text-carbon transition-colors hover:bg-slate/40 hover:text-ink"
      >
        {reference}
        <span aria-hidden className="text-[10px] text-metal">
          ⓘ
        </span>
      </button>

      {open ? (
        /* Panel oscuro (ink sobre claro, mismo tratamiento que la card del
           certificado): se despega del contenido y se lee como overlay. */
        <span
          id={panelId}
          role="dialog"
          aria-label={citation.norm}
          className="absolute left-0 top-[calc(100%+6px)] z-30 block w-[340px] max-w-[82vw] rounded-cards bg-ink p-16 text-left shadow-[rgba(16,18,22,0.4)_0px_14px_36px_-12px]"
        >
          <span className="block text-caption font-semibold leading-[1.4] text-white">
            {citation.norm}
          </span>
          <span className="mt-[6px] block text-caption font-normal leading-[1.55] text-[#b5bdc9]">
            {citation.summary}
          </span>
          <span className="mt-[10px] flex items-center justify-between gap-12 border-t border-[#34353a] pt-[10px]">
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-caption font-semibold text-white underline decoration-[#8f99a8] underline-offset-2 hover:decoration-white"
            >
              {t("officialText")} ↗
            </a>
            <span className="text-[11px] text-[#8f99a8]">{t("disclaimer")}</span>
          </span>
        </span>
      ) : null}
    </span>
  );
}
