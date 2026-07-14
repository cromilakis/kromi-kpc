import { describe, expect, it } from "vitest";
import {
  BASE_UF,
  IVA_RATE,
  UF_CLP,
  computeServiceUf,
  formatClp,
  formatUf,
  launchPriceUf,
  listPriceUf,
  serviceChargeClp,
} from "../lib/self-assessment/pricing";

/**
 * Precio del servicio DPC (cara al cliente): base por tamaño + recargo fijo en
 * UF por factor de complejidad. La propiedad de negocio clave: una empresa
 * pequeña con muchos factores puede costar menos que una mayor con pocos.
 */
describe("computeServiceUf", () => {
  it("sin factores devuelve el valor base del tramo", () => {
    expect(computeServiceUf("micro", [])).toBe(BASE_UF.micro);
    expect(computeServiceUf("small", [])).toBe(BASE_UF.small);
    expect(computeServiceUf("enterprise", [])).toBe(BASE_UF.enterprise);
  });

  it("suma el recargo fijo por cada factor detectado", () => {
    // micro 10 + sensibles 8 + transf. 5 + multi-sede 3 + prov. críticos 4 = 30
    expect(
      computeServiceUf("micro", [
        "sensitive_data",
        "international_transfers",
        "multi_site",
        "critical_providers",
      ]),
    ).toBe(30);
  });

  it("no duplica el recargo si un factor viene repetido", () => {
    expect(
      computeServiceUf("micro", ["sensitive_data", "sensitive_data"]),
    ).toBe(BASE_UF.micro + 8);
  });

  it("una micro con muchos factores sale por debajo de una pequeña con uno", () => {
    const microMany = computeServiceUf("micro", [
      "sensitive_data",
      "international_transfers",
      "multi_site",
      "critical_providers",
    ]);
    const smallOne = computeServiceUf("small", ["sensitive_data"]);
    expect(microMany).toBeLessThan(smallOne); // 30 < 33
  });

  it("low_maturity no recarga (no se deriva del diagnóstico público)", () => {
    expect(computeServiceUf("micro", ["low_maturity"])).toBe(BASE_UF.micro);
  });
});

describe("precio de lanzamiento (precio real, −20% lanzamiento)", () => {
  it("el precio normal es el valor real del servicio (sin recargo)", () => {
    expect(listPriceUf(27)).toBe(27);
  });

  it("el precio de lanzamiento aplica 20% de descuento sobre el real", () => {
    expect(launchPriceUf(27)).toBeCloseTo(21.6);
    expect(launchPriceUf(27)).toBeCloseTo(27 * 0.8);
    expect(launchPriceUf(27)).toBeCloseTo(listPriceUf(27) * 0.8);
  });

  it("formatUf usa coma decimal y a lo sumo un decimal", () => {
    expect(formatUf(13)).toBe("13");
    expect(formatUf(35.1)).toBe("35,1");
    expect(formatUf(17.55)).toBe("17,6");
  });
});

describe("cobro en CLP (zero-decimal + IVA)", () => {
  it("cobra el precio de lanzamiento en CLP con IVA, como entero de pesos", () => {
    const uf = 27;
    const expected = Math.round(launchPriceUf(uf) * UF_CLP * (1 + IVA_RATE));
    expect(serviceChargeClp(uf)).toBe(expected);
    expect(Number.isInteger(serviceChargeClp(uf))).toBe(true);
  });

  it("el monto no está multiplicado por 100 (CLP es zero-decimal)", () => {
    // ~21,6 UF × 40.844 × 1,19 ≈ 1.050.000, NO ~105 millones.
    expect(serviceChargeClp(27)).toBeGreaterThan(500_000);
    expect(serviceChargeClp(27)).toBeLessThan(2_000_000);
  });

  it("formatClp usa punto como separador de miles (es-CL)", () => {
    expect(formatClp(1234567)).toBe("$1.234.567");
  });
});
