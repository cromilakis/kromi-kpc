import { describe, expect, it } from "vitest";
import { formatFineClp } from "../lib/legal/fine";
import { UTM_CLP } from "../lib/legal";

describe("formatFineClp", () => {
  it("formatea un rango en CLP con separador de miles", () => {
    const s = formatFineClp(100, 5000);
    expect(s).toBe(`$${(100 * UTM_CLP).toLocaleString("es-CL")} – $${(5000 * UTM_CLP).toLocaleString("es-CL")}`);
  });

  it("colapsa a un solo valor cuando min === max", () => {
    expect(formatFineClp(100, 100)).toBe(`$${(100 * UTM_CLP).toLocaleString("es-CL")}`);
  });

  it("devuelve null si falta algún extremo", () => {
    expect(formatFineClp(null, 5000)).toBeNull();
    expect(formatFineClp(100, null)).toBeNull();
    expect(formatFineClp(null, null)).toBeNull();
  });

  it("no multiplica por 100 raro (rango en pesos plausible)", () => {
    const s = formatFineClp(100, 5000)!;
    expect(s).toContain("$"); // valores en millones de pesos, no centavos
  });
});
