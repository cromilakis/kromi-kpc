/**
 * Evaluador de aplicabilidad de controles.
 *
 * Regla en la base de datos (controls.applies_when), evaluador puro en la aplicación.
 * Sin regla (null) => el control siempre aplica. Con regla => aplica si alguno de los
 * factores declarados por la empresa está en el conjunto de la regla.
 */

/**
 * Especificación de cuándo un control es aplicable.
 * - null: el control aplica siempre (sin restricción por factor).
 * - { factors_any: [...] }: el control aplica si la empresa declaró alguno de esos factores.
 */
export type AppliesWhen = { factors_any?: string[] } | null;

/**
 * Evalúa si un control aplica a una empresa dada su regla y factores.
 *
 * @param rule - Especificación de aplicabilidad del control (null o con factors_any).
 * @param companyFactors - Factores declarados por la empresa (e.g. ["sensitive_data", "automated_decisions"]).
 * @returns true si el control aplica; false en caso contrario.
 *
 * Regla:
 * - null => true (siempre aplica).
 * - { factors_any: [] } => true (aplica aunque no hay restricción).
 * - { factors_any: ["a", "b"] } && companyFactors = ["b"] => true (hay match).
 * - { factors_any: ["a", "b"] } && companyFactors = ["x"] => false (sin match).
 */
export function controlApplies(rule: AppliesWhen, companyFactors: string[]): boolean {
  // Sin regla => siempre aplica.
  if (rule === null) {
    return true;
  }

  // Regla con factors_any vacío o ausente => aplica.
  const factors = rule.factors_any ?? [];
  if (factors.length === 0) {
    return true;
  }

  // Regla con factors_any poblado => aplica si hay intersección.
  return factors.some((factor) => companyFactors.includes(factor));
}

/**
 * Extrae los factores que hacen inaplicable un control (para mostrar motivo).
 *
 * @param rule - Especificación de aplicabilidad del control.
 * @returns Lista de factores de la regla (vacía si null o factors_any ausente).
 */
export function inapplicabilityFactors(rule: AppliesWhen): string[] {
  return rule?.factors_any ?? [];
}
