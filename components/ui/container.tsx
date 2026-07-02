import type { ComponentPropsWithoutRef } from "react";
import { cn } from "./cn";

/**
 * Container — ancho del prototipo: max-width 1180px (landing), centrado,
 * padding horizontal 32px (prototype-analysis.md §7.9: decisión válida
 * frente a los 1440px del Style Reference).
 */
export type ContainerProps = ComponentPropsWithoutRef<"div">;

export function Container({ className, ...props }: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[1180px] px-32", className)}
      {...props}
    />
  );
}
