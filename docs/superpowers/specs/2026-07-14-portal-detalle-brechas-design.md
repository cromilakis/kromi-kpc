# Portal de Evaluaciones — detalle de brechas — Diseño (sub-proyecto #3)

Fecha: 2026-07-14
Estado: aprobado (pendiente de plan de implementación)

## Contexto

Tercer sub-proyecto del programa "construcción de documentos" (ver
`2026-07-12-diagnostico-persistido-design.md`). El diagnóstico persistido (#1) y el
diagnóstico asistido del consultor (#2) ya están en `main`. Este sub-proyecto le da al
**cliente** una sección de **Evaluaciones** en su portal para acceder a su diagnóstico
y ver cada brecha en detalle.

Sustrato existente:
- Tablas `company_diagnoses` (cabecera: `status active|superseded`, `source`,
  `answers`, `risk_level`, `total_breaches`) y `diagnosis_breaches` (una fila por
  brecha: `breach_code`, `area`,
  `area_label`, `severity`, `articles`, `fine_min_utm`, `fine_max_utm`, `description`,
  `dimension`, `resolution_status`), ambas **legibles por el cliente** vía RLS (#1).
- Portal (`app/portal/`): hoy una sola página con estados (`portalServiceState`:
  pending/preparing/ready) + `preliminary_panorama`. Sin navegación.
- `companies.service_paid_at` (proyección del pago) legible por el cliente vía
  `company_client_view`.
- `lib/legal`: `BreachDescriptor` (description corta, severity, articles, fineRangeUtn,
  dimension) y `UTM_CLP`. ~18 códigos de brecha (áreas SEG, LEG, TER, CON, CCT, SAL,
  BIO, WEB, DER, MEN, GOB, CAP). NO hay texto largo "por qué es riesgo / qué dice la ley".

## Objetivo

Que el cliente **pagado** entre a **Evaluaciones**, vea la lista de brechas de su
diagnóstico y el detalle de cada una: qué se encontró, **por qué es un riesgo para su
empresa**, **qué dice la ley** (en detalle) y la **gravedad de la multa**.

## Decisiones tomadas (con el usuario)

1. **Contenido legal largo**: catálogo en código por `breach_code`; **redacto un
   borrador** para las ~18 brechas, marcado como pendiente de revisión legal (gate
   previo al deploy, que el usuario controla). Sin banner "borrador" cara al cliente.
2. **Desbloqueo**: el detalle completo se desbloquea **al pagar** (`service_paid_at`),
   inmediato, sin esperar al consultor. El no-pagado sigue viendo solo el panorama
   preliminar (teaser gratis).
3. Solo empresas self-service tienen cliente con login hoy (el #2 no crea cuenta de
   cliente), así que el gate es simplemente **pagado**; no hay caso especial.

## Navegación y acceso

- **Navegación** en el header del portal (`app/portal/layout.tsx`): dos ítems —
  **Inicio** (dashboard actual) y **Evaluaciones**.
- Rutas nuevas:
  - `app/portal/evaluaciones/page.tsx` — lista de brechas del diagnóstico **activo**.
  - `app/portal/evaluaciones/[breachId]/page.tsx` — detalle de una brecha.
- **Gate (server component):** solo con `service_paid_at` no nulo. No pagado →
  estado bloqueado ("completa tu pago", con acceso al re-pago existente); nunca se
  filtra ninguna brecha. Reusa `portalServiceState`/`company_client_view`.

## Datos

- **Loader** `lib/portal/load-diagnosis.server.ts` (cliente autenticado, RLS): lee el
  `company_diagnoses` con `status='active'` de la empresa y sus `diagnosis_breaches`.
  Devuelve una estructura vacía coherente si no hay diagnóstico o no está pagado (no
  filtra detalle). El detalle por `breachId` lee la fila `diagnosis_breaches` por `id`
  (RLS acota a la empresa; uuid inexistente/ajeno → `notFound()`).

## Contenido de la brecha

**Catálogo** `lib/legal/breach-content.ts`, keyed por `breach_code`:
```
export interface BreachContent { whyRisk: string; lawDetail: string }
export function getBreachContent(breachCode: string): BreachContent | null
```
- `whyRisk` — "por qué es un riesgo para tu empresa" (concreto, lenguaje llano).
- `lawDetail` — "qué dice la ley" (explica los artículos citados en detalle).
- ~18 entradas redactadas como **borrador**, con banner de módulo "PENDIENTE DE
  REVISIÓN LEGAL" (revisión previa al deploy). Sin banner cara al cliente.

**Detalle de una brecha** (persistido + catálogo):
- Título/área (`area_label`) + **severidad** (badge) + **gravedad de la multa**
  (`fine_min/max_utm × UTM_CLP` → rango CLP formateado, con el label de severidad).
- "Qué encontramos" — `description` persistida.
- "Por qué es un riesgo para tu empresa" — `whyRisk` del catálogo.
- "Qué dice la ley" — `lawDetail` + lista de `articles` persistidos.

**Degradación:** brecha sin entrada en el catálogo → muestra lo persistido y omite las
secciones largas, sin romperse.

**Lista:** brechas agrupadas por área y ordenadas por severidad (crítico→bajo); cada
fila con título + badge de severidad + multa, enlaza al detalle. Reusa el estilo de
severidad de `components/self-assessment/diagnosis-result.tsx`.

## Alcance

**En #3:** navegación del portal; rutas `evaluaciones` (lista + detalle) gated a pagado;
loader del diagnóstico activo + brechas; catálogo `breach-content.ts` + `getBreachContent`
(con tests) + borrador de ~18 entradas; multa UTM→CLP; i18n de la sección.

**Fuera de #3:** botón/documento de propuesta de mitigación por brecha (#5), documento
consolidado (#5), marcar brecha resuelta y "completar mitigación" (#6), documento final
de catastro + certificado (#7), infra de generación de documentos (#4), vista del
consultor, remoción de lo viejo (#8).

## Casos borde

- **No pagado:** Evaluaciones bloqueada (aviso + re-pago); sin fuga de brechas.
- **Sin diagnóstico activo:** estado vacío coherente.
- **Brecha sin contenido de catálogo:** degrada a lo persistido.
- **`breachId` inválido / de otra empresa:** `notFound()` (la RLS acota; uuid inexistente = 404).

## Pruebas

- **Unit (Vitest):** `getBreachContent` (entrada válida / `null` para código desconocido);
  formateador de multa UTM→CLP (rango en pesos, sin ×100 raro).
- **E2E (Playwright):** cliente **pagado** → lista de Evaluaciones + detalle de una brecha
  (con "por qué / qué dice la ley / multa"); cliente **no pagado** → bloqueada. Reusa el
  flujo post-pago para llegar al estado pagado.

## Nota de revisión legal (pre-deploy)

El contenido de `breach-content.ts` es un **borrador** redactado para acelerar; debe
pasar **revisión legal del equipo antes de producción**. El deploy (migraciones remotas
+ publicación) es un paso separado que el usuario controla, así que el borrador no llega
a clientes reales hasta el sign-off.
