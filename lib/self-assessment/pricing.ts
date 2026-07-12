import type { ComplexityFactor, SizeTier } from "@/lib/companies/schema";

/**
 * Precio del servicio DPC (diagnóstico + propuesta de mitigación +
 * certificación) para el lead público: total = base por tamaño + recargo fijo
 * en UF por cada factor de complejidad detectado en el diagnóstico. Así una
 * micro con varios factores puede salir por debajo de una empresa mayor con
 * pocos (decisión de precio 2026-07-11).
 *
 * OJO: estos son valores CARA AL CLIENTE (se muestran en la confirmación del
 * lead), a diferencia del Complexity Score interno 0-100
 * (lib/companies/scoring.server.ts), que es server-only y nunca se expone.
 */

/** Valor base por tramo, en UF (fijados 2026-07-11, UF ≈ $40.844). */
export const BASE_UF: Record<SizeTier, number> = {
  micro: 10,
  small: 25,
  enterprise: 60,
};

/** Recargo en UF por cada factor de complejidad presente en el diagnóstico. */
export const FACTOR_UF: Record<ComplexityFactor, number> = {
  sensitive_data: 8,
  automated_decisions: 6,
  international_transfers: 5,
  critical_providers: 4,
  multi_site: 3,
  low_maturity: 0, // no se deriva del diagnóstico público; no recarga.
};

/** Total del servicio en UF = base(tamaño) + Σ recargos por factor. */
export function computeServiceUf(
  sizeTier: SizeTier,
  factors: readonly ComplexityFactor[],
): number {
  let uf = BASE_UF[sizeTier];
  for (const factor of new Set(factors)) uf += FACTOR_UF[factor] ?? 0;
  return uf;
}

/**
 * Estrategia de lanzamiento HONESTA (sin ancla inflada, para no exponerse ante
 * el SERNAC): el precio "normal" tachado es el valor REAL del servicio y el
 * lanzamiento aplica un 20% de descuento genuino para las primeras empresas.
 * Pasado el lanzamiento se vuelve al valor real quitando el descuento.
 */
export const LAUNCH_DISCOUNT = 0.2;

/** Precio "normal" (tachado) = valor real del servicio, sin recargo. */
export function listPriceUf(serviceUf: number): number {
  return serviceUf;
}

/** Precio de lanzamiento (lo que paga el cliente) = real × (1 − 0,20). */
export function launchPriceUf(serviceUf: number): number {
  return serviceUf * (1 - LAUNCH_DISCOUNT);
}

/** Formatea UF a lo sumo con 1 decimal, con coma decimal (es-CL). */
export function formatUf(uf: number): string {
  return (Math.round(uf * 10) / 10).toString().replace(".", ",");
}

/**
 * Valor de la UF en CLP para el cobro (modo test). Fijo por ahora; si en el
 * futuro se cobra en producción, debería leerse el valor vigente del día.
 */
export const UF_CLP = 40844;

/** IVA Chile (19%): el precio se muestra "+ IVA" y el cobro va con IVA incluido. */
export const IVA_RATE = 0.19;

/**
 * Monto a cobrar en CLP (bruto, IVA incluido) del precio de LANZAMIENTO.
 * CLP es moneda de cero decimales en Stripe: este entero se pasa a
 * `unit_amount` TAL CUAL (sin ×100).
 */
export function serviceChargeClp(serviceUf: number): number {
  const netClp = launchPriceUf(serviceUf) * UF_CLP;
  return Math.round(netClp * (1 + IVA_RATE));
}

/** Formatea CLP como "$1.234.567" (separador de miles es-CL, sin decimales). */
export function formatClp(clp: number): string {
  return `$${Math.round(clp).toLocaleString("es-CL")}`;
}
