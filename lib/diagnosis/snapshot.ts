import {
  BREACH_AREA_LABELS,
  DEEP_DIVE_BRANCHES,
  INFERENCE_RULES,
  SCREENING_NODES,
  computeFullDiagnosis,
  walkScreening,
  type BreachDescriptor,
  type DeepDiveAnswer,
  type ScreeningAnswer,
} from "@/lib/legal";

/** Respuestas serializadas del cuestionario (screening + deep-dive). */
export interface DiagnosisAnswers {
  screening: ScreeningAnswer[];
  deepDive: DeepDiveAnswer[];
}

/** Snapshot inmutable de una brecha para persistir. */
export interface BreachSnapshot {
  breachCode: string;
  area: string;
  areaLabel: string;
  severity: string;
  articles: string[];
  fineMinUtm: number;
  fineMaxUtm: number;
  description: string;
  dimension: number;
}

/** Área = segundo segmento del code ("B-SEG-003" → "SEG"). */
function areaOf(breachCode: string): string {
  return breachCode.split("-")[1] ?? "";
}

export function toBreachSnapshot(breach: BreachDescriptor): BreachSnapshot {
  const area = areaOf(breach.id);
  return {
    breachCode: breach.id,
    area,
    areaLabel: BREACH_AREA_LABELS[area] ?? area,
    severity: breach.severity,
    articles: [...breach.articles],
    fineMinUtm: breach.fineRangeUtn.min,
    fineMaxUtm: breach.fineRangeUtn.max,
    description: breach.description,
    dimension: breach.dimension,
  };
}

/**
 * Recomputa el diagnóstico desde las respuestas con el motor lib/legal y
 * devuelve un resultado serializable listo para persistir. Función pura.
 */
export function computeDiagnosisSnapshot(answers: DiagnosisAnswers): {
  riskLevel: string;
  totalBreaches: number;
  breaches: BreachSnapshot[];
} {
  const walked = walkScreening(SCREENING_NODES, answers.screening);
  const result = computeFullDiagnosis(
    walked,
    INFERENCE_RULES,
    DEEP_DIVE_BRANCHES,
    answers.deepDive,
  );
  return {
    riskLevel: result.riskLevel,
    totalBreaches: result.totalBreaches,
    breaches: result.breaches.map(toBreachSnapshot),
  };
}
