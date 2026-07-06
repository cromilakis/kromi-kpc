"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/components/ui";
import { COUNTRIES } from "@/lib/interview/countries";

/**
 * Selector de países con selección múltiple y búsqueda, para el destino de
 * transferencias internacionales del RAT. Muestra los elegidos como chips
 * (removibles) y un desplegable buscable para agregar/quitar. Guarda los
 * nombres en español (coherente con el resto del RAT).
 */
export function CountryMultiSelect({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("app.diagnosis.rat.countrySelect");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = new Set(value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.toLowerCase().includes(q));
  }, [query]);

  function toggle(country: string) {
    if (selected.has(country)) {
      onChange(value.filter((c) => c !== country));
    } else {
      onChange([...value, country]);
    }
  }

  return (
    <div className="relative" ref={ref}>
      {/* Chips de países elegidos + botón para abrir el buscador. */}
      <div
        className={cn(
          "flex min-h-36 flex-wrap items-center gap-4 rounded-inputs border border-slate bg-white px-8 py-[5px]",
          disabled && "bg-ash opacity-60",
        )}
      >
        {value.map((country) => (
          <span
            key={country}
            className="inline-flex items-center gap-4 rounded-tags bg-ash px-8 py-[2px] text-caption leading-caption text-ink"
          >
            {country}
            {!disabled ? (
              <button
                type="button"
                onClick={() => toggle(country)}
                aria-label={t("remove", { country })}
                className="cursor-pointer text-carbon hover:text-danger-red"
              >
                ×
              </button>
            ) : null}
          </span>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className="cursor-pointer px-4 text-caption leading-caption text-carbon underline-offset-2 hover:underline disabled:cursor-not-allowed"
        >
          {value.length === 0 ? t("placeholder") : t("add")}
        </button>
      </div>

      {open && !disabled ? (
        <div className="absolute z-10 mt-4 w-full rounded-tags border border-stone bg-white p-8 shadow-[rgba(28,40,64,0.1)_0px_12px_32px_-12px]">
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="mb-8 w-full rounded-inputs border border-slate bg-white px-12 py-[6px] text-body-sm text-ink placeholder:text-overcast focus:border-focus-blue focus:outline-none"
          />
          <ul className="max-h-[220px] overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-8 py-4 text-caption leading-caption text-carbon">
                {t("empty")}
              </li>
            ) : (
              filtered.map((country) => {
                const isSelected = selected.has(country);
                return (
                  <li key={country}>
                    <button
                      type="button"
                      onClick={() => toggle(country)}
                      className={cn(
                        "flex w-full items-center gap-8 rounded-tags px-8 py-4 text-left text-body-sm transition-colors hover:bg-ash",
                        isSelected && "bg-ash",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-[4px] border",
                          isSelected ? "border-ink bg-ink text-white" : "border-slate bg-white",
                        )}
                        aria-hidden="true"
                      >
                        {isSelected ? (
                          <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        ) : null}
                      </span>
                      <span className="text-ink">{country}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
