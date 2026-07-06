import { describe, it, expect } from "vitest";
import {
  applicableNodes,
  applyAnswer,
  evalCondition,
  nextNode,
} from "@/lib/interview/script/engine";
import type { Script, ScriptNode } from "@/lib/interview/script/types";

const script: Script = {
  id: "test",
  title: "Test",
  nodes: [
    {
      id: "proveedores",
      question: "¿Trabajan con proveedores externos?",
      allowOther: true,
      covers: [{ control: "DPC-TER-001", criterion: 1 }],
      options: [
        { id: "no", label: "No", effect: { factors: ["sin_encargados"] } },
        {
          id: "si_contrato",
          label: "Sí, con contrato",
          effect: {
            factors: ["critical_providers"],
            sets: [{ control: "DPC-TER-001", criterion: 1, answer: "yes" }],
          },
        },
        {
          id: "si_sin",
          label: "Sí, sin contrato",
          effect: {
            factors: ["critical_providers"],
            sets: [{ control: "DPC-TER-001", criterion: 1, answer: "no" }],
          },
        },
      ],
    },
    {
      id: "cert",
      question: "¿El proveedor tiene certificación?",
      condition: { anyOption: { node: "proveedores", options: ["si_contrato", "si_sin"] } },
      covers: [{ control: "DPC-TER-001", criterion: 2 }],
      options: [
        { id: "si", label: "Sí", effect: { sets: [{ control: "DPC-TER-001", criterion: 2, answer: "yes" }] } },
        { id: "no", label: "No", effect: { sets: [{ control: "DPC-TER-001", criterion: 2, answer: "no" }] } },
      ],
    },
  ],
};

describe("evalCondition", () => {
  it("anyOption: true si se eligió una de las opciones", () => {
    expect(evalCondition(script.nodes[1]!.condition, { proveedores: { options: ["si_sin"] } }, [])).toBe(true);
    expect(evalCondition(script.nodes[1]!.condition, { proveedores: { options: ["no"] } }, [])).toBe(false);
  });
  it("hasFactor / not / all / any", () => {
    expect(evalCondition({ hasFactor: "x" }, {}, ["x"])).toBe(true);
    expect(evalCondition({ not: { hasFactor: "x" } }, {}, [])).toBe(true);
    expect(evalCondition({ all: [{ hasFactor: "x" }, { hasFactor: "y" }] }, {}, ["x"])).toBe(false);
    expect(evalCondition({ any: [{ hasFactor: "x" }, { hasFactor: "y" }] }, {}, ["y"])).toBe(true);
  });
});

describe("nextNode / applicableNodes", () => {
  it("empieza por el primer nodo sin responder", () => {
    expect(nextNode(script, {}, [])?.id).toBe("proveedores");
  });
  it("salta el nodo condicional si no aplica", () => {
    const answers = { proveedores: { options: ["no"] } };
    expect(nextNode(script, answers, [])).toBeNull(); // 'cert' no aplica → terminó
    expect(applicableNodes(script, answers, []).map((n) => n.id)).toEqual(["proveedores"]);
  });
  it("muestra el nodo condicional si aplica", () => {
    const answers = { proveedores: { options: ["si_sin"] } };
    expect(nextNode(script, answers, [])?.id).toBe("cert");
    expect(applicableNodes(script, answers, []).map((n) => n.id)).toEqual([
      "proveedores",
      "cert",
    ]);
  });
});

describe("applyAnswer", () => {
  it("setea criterios y factores de la opción elegida", () => {
    const out = applyAnswer(script.nodes[0]!, ["si_contrato"], undefined);
    expect(out.factors).toContain("critical_providers");
    expect(out.compliance).toContainEqual({
      control: "DPC-TER-001",
      criterion: 1,
      answer: "yes",
    });
  });
  it("'Otros' marca los criterios cubiertos como flagged", () => {
    const out = applyAnswer(script.nodes[0]!, [], "algo raro");
    expect(out.compliance).toContainEqual({
      control: "DPC-TER-001",
      criterion: 1,
      answer: "flagged",
    });
  });
  it("un criterio cubierto sin veredicto queda flagged", () => {
    // ninguna opción setea el criterio 1 (elige una opción sin ese set)
    const node: ScriptNode = {
      id: "x",
      question: "q",
      covers: [{ control: "C", criterion: 0 }],
      options: [{ id: "a", label: "A" }],
    };
    const out = applyAnswer(node, ["a"], undefined);
    expect(out.compliance).toContainEqual({ control: "C", criterion: 0, answer: "flagged" });
  });
});
