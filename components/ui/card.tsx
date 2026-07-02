import type { ComponentPropsWithoutRef } from "react";
import { cn } from "./cn";

/**
 * Card / UI Frame — Style Reference Attio (§Components "UI Frame Card"):
 * bg White, borde 1px Stone, radius 8px (rounded-cards), padding 16px,
 * sombra --shadow-subtle-2.
 * `padded={false}` para cards con tabla (overflow hidden, sin padding interno,
 * prototipo §3.3 "Card con tabla").
 */
export interface CardProps extends ComponentPropsWithoutRef<"div"> {
  /** Padding interno de 16px (card estándar). Desactivar para cards con tabla. */
  padded?: boolean;
}

export function Card({ padded = true, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-cards border border-stone bg-white shadow-subtle-2",
        padded ? "p-16" : "overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

/** Alias semántico del Style Reference ("UI Frame Card"). */
export const UIFrame = Card;
