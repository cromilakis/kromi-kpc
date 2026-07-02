import type { ComponentPropsWithoutRef } from "react";
import { cn } from "./cn";
import { formControlClasses } from "./form-control";

/**
 * Textarea — mismos estilos de control que Input (Style Reference "Text Input").
 */
export type TextareaProps = ComponentPropsWithoutRef<"textarea">;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(formControlClasses, "min-h-[96px] resize-y", className)}
      {...props}
    />
  );
}
