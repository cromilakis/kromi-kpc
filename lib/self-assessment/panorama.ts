import {
  groupBreachesByAreaSeverity,
  type FullDiagnosisResult,
  type RiskLevel,
  type Severity,
} from "@/lib/legal";

/**
 * Resumen serializable del panorama preliminar para persistir y mostrar en el
 * portal (estado "en preparación"). No incluye texto libre del usuario ni
 * detalle interno: solo nivel, total y áreas agrupadas por severidad.
 */
export interface PreliminaryPanorama {
  riskLevel: RiskLevel;
  totalBreaches: number;
  areas: { areaLabel: string; severity: Severity; count: number }[];
}

export function buildPreliminaryPanorama(
  result: FullDiagnosisResult,
): PreliminaryPanorama {
  const groups = groupBreachesByAreaSeverity(result.breaches);
  return {
    riskLevel: result.riskLevel,
    totalBreaches: result.totalBreaches,
    areas: groups.map((g) => ({
      areaLabel: g.areaLabel,
      severity: g.severity,
      count: g.count,
    })),
  };
}
