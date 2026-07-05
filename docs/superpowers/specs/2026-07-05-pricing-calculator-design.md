# Calculadora de precios de la prestación (interna) — Diseño

**Fecha:** 2026-07-05
**Estado:** propuesta (pendiente de revisión del usuario/equipo)
**Ámbito:** herramienta INTERNA del consultor (no cara pública)

## Objetivo

Traducir el perfil de una empresa (el mismo que la plataforma ya evalúa) a una
**cotización sugerida** para la prestación del servicio de cumplimiento
(Ley 21.719), diferenciando por **complejidad/riesgo/esfuerzo** — no por tamaño
crudo — y capturando el ingreso recurrente (recertificación anual).

## Hallazgo del estudio (por qué NO se cobra uniforme ni por tamaño)

Cobrar plano falla en ambas direcciones: espanta a la micro (para la que una
tarifa alta es absurda) y regala margen en la clínica/supermercado (donde la
tarifa es barata frente a multas de hasta 350M + amonestación pública APDP).

El "tamaño" (nº de sedes/empleados) es un mal proxy: una **clínica de 1 sola
sucursal** (datos de salud sensibles + Ley 20.584) es más cara de servir y de
mayor exposición que una **cafetería con varias sucursales**. Los drivers reales
de esfuerzo/riesgo son: datos sensibles, sector regulado, volumen de titulares,
encargados/transferencias internacionales, multi-sede y madurez inicial —
exactamente los **factores que el wizard ya captura**.

## Principio: la calculadora es una capa sobre el Complexity Score existente

`lib/companies/scoring.server.ts` ya produce por empresa un `score` (0–100) y
`scoreTier` (bajo/medio/alto/crítico) desde tamaño × multiplicador sectorial +
factores. Ese eje ya diferencia los arquetipos correctamente:

| Arquetipo | Score aprox. | Tramo |
|---|---|---|
| Local 2 personas (otro, sin factores) | ~9 | bajo |
| Cafetería multi-sede (retail + multi_site + proveedores) | ~30–50 | bajo/medio |
| Clínica (salud 1.7 + sensibles) | ~70–88 | alto/crítico |
| Supermercado (enterprise + volumen + encargados + intl) | ~85–100 | crítico |

La calculadora **no introduce lógica nueva de scoring**: consume `score`/`tier`
y los mapea a plata.

## Modelo de cálculo

Tres salidas (la recurrente es el corazón del negocio, no un extra):

1. **Diagnóstico + adecuación** (one-time)
2. **Mantención / recertificación anual** (recurrente; engancha con el
   vencimiento de certificado que el modelo ya tiene: `active/expired/revoked`)
3. **Rango mostrado** = ±15% sobre el punto (es guía de cotización, no precio
   cerrado)

### Fórmula (piecewise por tramo + interpolación fina por score)

```ts
// lib/pricing/pricing.server.ts  — INTERNO (server-only, como el score)
import type { ScoreTier } from "@/lib/companies/scoring.server";

export const PRICING_BANDS: Record<ScoreTier, { floor: number; oneTime: number }> = {
  low:      { floor: 0,  oneTime: 350_000 },    // Esencial (idealmente self-service)
  medium:   { floor: 50, oneTime: 1_200_000 },  // Estándar
  high:     { floor: 70, oneTime: 3_500_000 },  // Avanzado
  critical: { floor: 85, oneTime: 7_000_000 },  // Enterprise → base de cotización
};
export const ANNUAL_PCT = 0.35; // mantención = 35% del one-time

export interface PriceQuote {
  oneTime: number;
  annual: number;
  range: [number, number];
  isCustom: boolean; // crítico → "desde X, cotización a medida"
}

export function quotePrice(score: number, tier: ScoreTier): PriceQuote {
  const band = PRICING_BANDS[tier];
  // +0.6% por punto sobre el piso del tramo → suaviza saltos entre bandas.
  const oneTime = Math.round(band.oneTime * (1 + (score - band.floor) * 0.006));
  const annual = Math.round(oneTime * ANNUAL_PCT);
  return {
    oneTime,
    annual,
    range: [Math.round(oneTime * 0.85), Math.round(oneTime * 1.15)],
    isCustom: tier === "critical",
  };
}
```

### Números que produce (CLP, redondeados) — HIPÓTESIS a validar

| Tramo | One-time (rango) | Anual |
|---|---|---|
| Esencial (bajo) | 300k–400k | ~120k |
| Estándar (medio) | ~1,0M–1,4M | ~420k |
| Avanzado (alto) | ~3,0M–4,0M | ~1,2M |
| Enterprise (crítico) | desde ~6,0M+ (cotización) | retainer |

**Estos montos NO son verdad de mercado** — son punto de partida; deben
validarse contra (a) el costo-hora real de servir cada tramo y (b) lo que cobran
consultoras de privacidad / estudios jurídicos en Chile.

## Reglas de negocio a codificar

1. **Piso por costo de servir**: nunca cotizar bajo `horas_consultor ×
   valor_hora` del tramo (ya descontado lo que automatiza el
   autodiagnóstico/LLM). El tramo Esencial solo es rentable *porque* es casi
   self-service — la palanca es la automatización de la plataforma, que baja el
   costo de servir a la micro (inviable en consultoría manual).
2. **Techo por valor**: la propuesta muestra la cotización **al lado de la multa
   evitada** (leve 7M … grave 350M) + riesgo reputacional. En alto/crítico manda
   el valor, no el costo.
3. **Recurrencia obligatoria**: `annual` es parte central de la propuesta, no
   opcional. La certificación vence → gancho natural de recurrencia.

## Los tres lentes para fijar/validar el número

1. **Costo de servir** (piso) · 2. **Valor / disposición a pagar** (techo:
multa + reputación) · 3. **Mercado** (referencia local). Cruzar los tres antes de
cerrar cada banda.

## Ubicación y privacidad (constraint duro)

- **Interno, lado consultor.** El Complexity Score es de uso interno (RFC §14.3,
  nunca se expone al cliente); por tanto la calculadora vive en la ficha de
  empresa `/app/companies/[id]` como tarjeta "Cotización sugerida". **No** va en
  la cara pública. El cliente ve la propuesta redactada, no el score ni la
  fórmula.
- Server-only (`pricing.server.ts`), reutiliza `computeCompanyScore`. `PRICING_BANDS`
  como fuente única editable sin tocar UI.

## Fuera de alcance v1

- Descuentos/paquetes multi-año, impuestos, monedas distintas a CLP.
- Ajuste automático "descuento por automatización" en Esencial (se puede sumar
  luego como factor explícito).
- Exponer cualquier precio en la cara pública.

## Trazabilidad / dependencias

- Reutiliza `lib/companies/scoring.server.ts` (`computeCompanyScore`,
  `ScoreTier`, umbrales ≥85/≥70/≥50).
- Los factores que alimentan el score ya se persisten en `companies.factors`
  (feature de entrevista dinámica).

## Testing (cuando se implemente)

- Unit (Vitest) de `quotePrice`: cada tier cae en su banda; interpolación
  monótona dentro de banda; `isCustom` solo en crítico; `range` = ±15%.
- Snapshot de los 4 arquetipos → montos esperados por tramo.

## Decisiones pendientes para revisar con el equipo

1. Validar los montos CLP contra costo-hora real y mercado (bloqueante antes de
   usarlos en propuestas).
2. ¿`ANNUAL_PCT` fijo (35%) o por tramo? (los tramos altos suelen ir a retainer
   mensual, no % del one-time).
3. ¿La tarjeta solo muestra el rango sugerido, o permite que el consultor lo
   ajuste y lo guarde como cotización de la empresa?
