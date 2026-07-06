import type { CriterionAnswer } from "@/lib/interview/auto-map";
import type {
  Script,
  ScriptAnswers,
  ScriptCondition,
  ScriptNode,
} from "@/lib/interview/script/types";

/**
 * Motor del guion guiado (puro, determinista): recorre los nodos, salta los que
 * no aplican (según respuestas/factores) y traduce las respuestas al borrador
 * del diagnóstico. Sin I/O ni estado global: mismas entradas → misma salida.
 */

const VERDICTS = new Set<CriterionAnswer>(["yes", "partial", "no"]);

export function evalCondition(
  condition: ScriptCondition | undefined,
  answers: ScriptAnswers,
  factors: string[],
): boolean {
  if (!condition) return true;
  if ("anyOption" in condition) {
    const picked = answers[condition.anyOption.node]?.options ?? [];
    return condition.anyOption.options.some((o) => picked.includes(o));
  }
  if ("hasFactor" in condition) return factors.includes(condition.hasFactor);
  if ("not" in condition) return !evalCondition(condition.not, answers, factors);
  if ("all" in condition)
    return condition.all.every((c) => evalCondition(c, answers, factors));
  if ("any" in condition)
    return condition.any.some((c) => evalCondition(c, answers, factors));
  return true;
}

/** Nodos aplicables (condición cumplida) — para el progreso. */
export function applicableNodes(
  script: Script,
  answers: ScriptAnswers,
  factors: string[],
): ScriptNode[] {
  return script.nodes.filter((node) => evalCondition(node.condition, answers, factors));
}

/** Primer nodo aplicable AÚN NO respondido (o null si terminó). */
export function nextNode(
  script: Script,
  answers: ScriptAnswers,
  factors: string[],
): ScriptNode | null {
  for (const node of script.nodes) {
    if (!evalCondition(node.condition, answers, factors)) continue;
    if (!answers[node.id]) return node;
  }
  return null;
}

/**
 * Traduce la respuesta de un nodo a cambios en el borrador. Devuelve los
 * criterios a setear (control::criterion → answer) y los factores a agregar.
 * Determinismo: si se elige "Otros" (otherText no vacío) o algún criterio de
 * `covers` no quedó con veredicto real, esos criterios se marcan 'flagged'.
 */
export function applyAnswer(
  node: ScriptNode,
  selectedOptionIds: string[],
  otherText: string | undefined,
): {
  compliance: Array<{ control: string; criterion: number; answer: CriterionAnswer }>;
  factors: string[];
} {
  const compliance = new Map<string, CriterionAnswer>();
  const factors = new Set<string>();
  const key = (c: string, i: number) => `${c}::${i}`;

  for (const optionId of selectedOptionIds) {
    const option = node.options.find((o) => o.id === optionId);
    if (!option?.effect) continue;
    for (const set of option.effect.sets ?? []) {
      compliance.set(key(set.control, set.criterion), set.answer);
    }
    for (const factor of option.effect.factors ?? []) factors.add(factor);
  }

  // "Otros" o criterios cubiertos sin veredicto real → 'flagged' (aclarar).
  const hasOther = !!otherText?.trim();
  for (const cover of node.covers ?? []) {
    const k = key(cover.control, cover.criterion);
    const current = compliance.get(k);
    if (hasOther || !current || !VERDICTS.has(current)) {
      compliance.set(k, "flagged");
    }
  }

  return {
    compliance: [...compliance.entries()].map(([k, answer]) => {
      const [control, idx] = k.split("::");
      return { control: control!, criterion: Number(idx), answer };
    }),
    factors: [...factors],
  };
}
