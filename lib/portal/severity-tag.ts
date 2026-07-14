import type { Severity } from "@/lib/legal";

/**
 * Clases de badge de severidad (crítico/alto/medio/bajo) — mismo patrón que
 * `components/self-assessment/diagnosis-result.tsx` y
 * `components/portal/service-status.tsx` (paleta monocroma, acento solo con
 * significado). Extraído a helper compartido porque las rutas de
 * Evaluaciones (Task 5: lista + detalle) lo necesitan en dos server
 * components sin duplicar el mapa una tercera vez.
 */
const SEVERITY_TAG_CLASSES: Record<Severity, string> = {
  critico: "bg-danger-red/10 text-danger-red",
  alto: "bg-warning-yellow/10 text-warning-yellow",
  medio: "bg-ash text-carbon",
  bajo: "bg-ash text-metal",
};

/**
 * `DiagnosisBreachRow.severity` viene tipado como `string` (snapshot de
 * base de datos); si llegara un valor fuera del enum conocido, se usa el
 * estilo neutro de "bajo" en vez de romper el render.
 */
export function severityTagClass(severity: string): string {
  return (
    SEVERITY_TAG_CLASSES[severity as Severity] ?? SEVERITY_TAG_CLASSES.bajo
  );
}
