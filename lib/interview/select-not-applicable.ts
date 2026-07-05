import { controlApplies, type AppliesWhen } from "@/lib/interview/applicability";

/**
 * Selección pura de qué controles del catálogo quedan fuera de alcance
 * ("No aplica") para una empresa dada, considerando el override del
 * consultor (`answers.applicability`) sobre la regla de aplicabilidad.
 *
 * Precedencia por control:
 * - `overrides[code] === false` → fuerza "No aplica" aunque la regla diga
 *   que aplica.
 * - `overrides[code] === true` → fuerza "aplica" (rescata) aunque la regla
 *   diga que no aplica.
 * - sin override → se usa `controlApplies(appliesWhen, companyFactors)`.
 */
export function selectNotApplicable(
  controls: Array<{ code: string; appliesWhen: AppliesWhen }>,
  companyFactors: string[],
  overrides: Record<string, boolean>,
): string[] {
  const notApplicable: string[] = [];
  for (const control of controls) {
    const applies =
      overrides[control.code] ?? controlApplies(control.appliesWhen, companyFactors);
    if (!applies) {
      notApplicable.push(control.code);
    }
  }
  return notApplicable;
}
