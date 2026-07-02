import type { ComponentPropsWithoutRef } from "react";
import { cn } from "./cn";
import { formControlClasses } from "./form-control";

/**
 * Input — Style Reference Attio "Text Input". Los estilos exactos viven en
 * form-control.ts (compartidos con Select y Textarea).
 */
export type InputProps = ComponentPropsWithoutRef<"input">;

export function Input({ className, ...props }: InputProps) {
  return <input className={cn(formControlClasses, className)} {...props} />;
}
