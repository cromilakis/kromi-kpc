import "server-only";

import type { EstimateInput, RiskFactor, SectorCode, SizeTier } from "./estimate";

/**
 * Complexity Score INTERNO del autoevaluador — SOLO SERVIDOR (D7, revisión
 * adversarial): los pesos finos del score (puntos por factor, puntos base por
 * tamaño, multiplicadores sectoriales y umbrales de tramo) no deben viajar en
 * el bundle del cliente. `import "server-only"` hace fallar el build de Next
 * si un módulo cliente llega a importar este archivo.
 *
 * Réplica de la pantalla de registro del prototipo (design/prototype.dc.html):
 * score = round(puntos base × multiplicador de rubro). RFC §14.3.
 *
 * REGLA DE NEGOCIO (RFC §11 / §14.3): el score es de USO INTERNO — solo se
 * persiste (via lib/actions/self-assessment.ts) para que el equipo consultor
 * dimensione el lead; el prospecto nunca lo ve.
 */

/** Multiplicadores sectoriales exactos del prototipo (this.RUBROS[].mult). */
export const SECTOR_MULTIPLIERS: Record<SectorCode, number> = {
  retail: 1.2,
  fintech: 1.8,
  salud: 1.7,
  b2b: 1.3,
  telco: 1.6,
  startup: 1.1,
  estado: 1.5,
};

/**
 * Puntos por factor — calibrados desde this.FACTORS del prototipo donde el
 * factor existe 1:1; los factores que el prototipo no puntúa (transferencias
 * internacionales, decisiones automatizadas) se calibran contra el RFC §14.3
 * (activan DPC-TER-002 y DPC-EIA-001/002 respectivamente).
 */
const FACTOR_POINTS: Record<RiskFactor, number> = {
  sensitive_data: 12, // prototipo: "Tratamiento de datos sensibles"
  international_transfers: 7, // RFC §14.3 (DPC-TER-002)
  automated_decisions: 9, // RFC §14.3 (DPC-EIA-001/002, EIPD)
  multi_site: 5, // prototipo: "Dispersión geográfica y sucursales"
  critical_providers: 6, // prototipo: "Proveedores críticos / encargados"
};

/**
 * Puntos base por tamaño — proxy de los factores estructurales que el
 * prototipo puntúa siempre ("Actividades de tratamiento" 8 + "Sistemas e
 * infraestructura" 8 + "Canales de recepción" 4 = 20 en el caso pleno),
 * escalados hacia abajo para organizaciones menores.
 */
const SIZE_BASE_POINTS: Record<SizeTier, number> = {
  micro: 8,
  small: 14,
  enterprise: 20,
};

/**
 * Prototipo: "Volumen de datos sensibles procesados" (9 pts) — RFC §14.3
 * habla de "tratamiento Y VOLUMEN de datos sensibles". Se aplica cuando la
 * organización trata datos sensibles y además es mediana/grande (proxy de
 * volumen alto).
 */
const SENSITIVE_VOLUME_BONUS = 9;

/** Tramo interno del score — umbrales exactos del prototipo (tier()). */
export type ScoreTier = "low" | "medium" | "high" | "critical";

/** Detalle INTERNO del Complexity Score — nunca mostrar al prospecto. */
export interface InternalScore {
  basePoints: number;
  multiplier: number;
  score: number;
  scoreTier: ScoreTier;
}

/** Umbrales del prototipo: tier(v){ >=85 Crítico; >=70 Alto; >=50 Medio; Bajo } */
function scoreTier(score: number): ScoreTier {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 50) return "medium";
  return "low";
}

/** Score interno: base × multiplicador de rubro (prototipo, registro). */
export function computeInternalScore(input: EstimateInput): InternalScore {
  const { sizeTier, sectorCode } = input;
  const selected = new Set<RiskFactor>(input.riskFactors);

  let basePoints = SIZE_BASE_POINTS[sizeTier];
  for (const factor of selected) basePoints += FACTOR_POINTS[factor];
  if (selected.has("sensitive_data") && sizeTier === "enterprise") {
    basePoints += SENSITIVE_VOLUME_BONUS;
  }
  const multiplier = SECTOR_MULTIPLIERS[sectorCode];
  const score = Math.round(basePoints * multiplier);

  return { basePoints, multiplier, score, scoreTier: scoreTier(score) };
}
