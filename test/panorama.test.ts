import { describe, expect, it } from "vitest";
import { buildPreliminaryPanorama } from "../lib/self-assessment/panorama";
import type { FullDiagnosisResult, BreachDescriptor } from "../lib/legal";

const mockBreach = (id: string, severity: "critico" | "alto" | "medio" | "bajo"): BreachDescriptor => ({
  id,
  description: "Test breach",
  severity,
  articles: [],
  fineRangeUtn: { min: 0, max: 0 },
  estimatedWeeks: 1,
  dimension: 1,
});

const result = {
  riskLevel: "alto",
  totalBreaches: 3,
  breaches: [
    mockBreach("B-LEG-001", "critico"),
    mockBreach("B-SAL-001", "critico"),
    mockBreach("B-CON-001", "medio"),
  ],
  deepDiveBreaches: [],
  processedBranches: [],
  bySeverity: { critico: 2, alto: 0, medio: 1, bajo: 0 },
  fineRange: { min: 0, max: 0 },
  estimatedWeeks: 0,
  activatedBranches: [],
  riskFactors: [],
} as unknown as FullDiagnosisResult;

describe("buildPreliminaryPanorama", () => {
  it("resume nivel, total y áreas agrupadas por severidad", () => {
    const p = buildPreliminaryPanorama(result);
    expect(p.riskLevel).toBe("alto");
    expect(p.totalBreaches).toBe(3);
    expect(p.areas.length).toBeGreaterThan(0);
    expect(p.areas[0]).toHaveProperty("areaLabel");
    expect(p.areas[0]).toHaveProperty("severity");
    expect(p.areas[0]).toHaveProperty("count");
  });

  it("es serializable a JSON sin pérdida", () => {
    const p = buildPreliminaryPanorama(result);
    expect(JSON.parse(JSON.stringify(p))).toEqual(p);
  });
});
