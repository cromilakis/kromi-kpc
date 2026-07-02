import type { ComponentPropsWithoutRef } from "react";
import { cn } from "./cn";

/**
 * ProgressBar — barra fina del prototipo (§3.6): track Ash, fill Ink por
 * defecto, alto 6px, radius 999. El color del fill puede cambiarse por
 * className (p. ej. colores por umbral pctColor) sin tocar el componente.
 * Accesible: role="progressbar" con aria-value*; el nombre accesible se pasa
 * por aria-label / aria-labelledby (cero strings hardcodeados).
 */
export interface ProgressBarProps extends ComponentPropsWithoutRef<"div"> {
  /** Valor actual (se recorta a [0, max]). */
  value: number;
  max?: number;
  /** Clases del fill (default bg-ink). */
  fillClassName?: string;
}

export function ProgressBar({
  value,
  max = 100,
  fillClassName,
  className,
  ...props
}: ProgressBarProps) {
  const safeMax = max > 0 ? max : 100;
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const pct = (clamped / safeMax) * 100;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={clamped}
      className={cn("h-[6px] w-full overflow-hidden rounded-full bg-ash", className)}
      {...props}
    >
      <div
        className={cn("h-full rounded-full bg-ink", fillClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
