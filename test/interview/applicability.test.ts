import { describe, expect, it } from "vitest";
import { controlApplies, inapplicabilityFactors } from "@/lib/interview/applicability";

describe("controlApplies", () => {
  it("null => siempre aplica", () =>
    expect(controlApplies(null, [])).toBe(true));
  it("factors_any con match => aplica", () =>
    expect(controlApplies({ factors_any: ["a", "b"] }, ["b"])).toBe(true));
  it("factors_any sin match => no aplica", () =>
    expect(controlApplies({ factors_any: ["a"] }, ["x"])).toBe(false));
  it("factors_any vacío => aplica", () =>
    expect(controlApplies({ factors_any: [] }, [])).toBe(true));
});

describe("inapplicabilityFactors", () => {
  it("devuelve los factores de la regla", () =>
    expect(inapplicabilityFactors({ factors_any: ["a"] })).toEqual(["a"]));
  it("null => []", () => expect(inapplicabilityFactors(null)).toEqual([]));
});
