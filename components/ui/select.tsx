import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import { cn } from "./cn";
import { formControlClasses } from "./form-control";

/**
 * Select — mismos estilos de control que Input (radius unificado en 7px,
 * token inputs; ver prototype-analysis.md §7.10). Chevron SVG por
 * background-image data-URI con appearance:none, como el prototipo (§3.6),
 * en color Carbon (#505967, rol "icons" del Style Reference).
 */
const chevronStyle: CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6l4 4 4-4' stroke='%23505967' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
  backgroundPosition: "right 12px center",
};

export type SelectProps = ComponentPropsWithoutRef<"select">;

export function Select({ className, style, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(formControlClasses, "appearance-none bg-no-repeat pr-36", className)}
      style={{ ...chevronStyle, ...style }}
      {...props}
    >
      {children}
    </select>
  );
}
