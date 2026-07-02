"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "./cn";

/**
 * Tabs — Style Reference Attio "Feature Tab Button": transparente, texto
 * Metal 15px/500, padding 8px 16px, radius 0 (rounded-none); activo: texto
 * Ink + border-bottom 2px Ink. Grupo con línea base Stone.
 * Cliente ("use client") por interactividad: click + navegación por teclado
 * (flechas / Home / End, patrón tablist WAI-ARIA).
 *
 * TODO(a11y): el patrón tablist queda incompleto — falta aria-controls en
 * cada tab e id/aria-labelledby en los tabpanels asociados (hoy el API no
 * recibe ids de paneles). Se difiere hasta que Tabs tenga uso en la cara
 * pública / plataforma interna.
 */
export interface TabItem {
  key: string;
  label: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  /** Nombre accesible del tablist (viene del consumidor, no se hardcodea). */
  "aria-label"?: string;
  className?: string;
}

export function Tabs({
  items,
  activeKey,
  onChange,
  className,
  "aria-label": ariaLabel,
}: TabsProps) {
  const refs = useRef<Map<string, HTMLButtonElement>>(new Map());

  function focusAndActivate(index: number) {
    const item = items[index];
    if (!item) return;
    refs.current.get(item.key)?.focus();
    onChange(item.key);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = items.length - 1;
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        focusAndActivate(index === last ? 0 : index + 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        focusAndActivate(index === 0 ? last : index - 1);
        break;
      case "Home":
        event.preventDefault();
        focusAndActivate(0);
        break;
      case "End":
        event.preventDefault();
        focusAndActivate(last);
        break;
    }
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("flex border-b border-stone", className)}
    >
      {items.map((item, index) => {
        const active = item.key === activeKey;
        return (
          <button
            key={item.key}
            ref={(node) => {
              if (node) {
                refs.current.set(item.key, node);
              } else {
                refs.current.delete(item.key);
              }
            }}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.key)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "-mb-px rounded-none border-b-2 px-16 py-8 text-[15px] font-medium leading-[1.4] transition-colors",
              active
                ? "border-ink text-ink"
                : "border-transparent text-metal hover:text-ink",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
