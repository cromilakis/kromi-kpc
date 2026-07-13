# Modelo de diagnóstico persistido — Diseño (sub-proyecto #1)

Fecha: 2026-07-12
Estado: aprobado (pendiente de plan de implementación)

## Contexto y programa

Decisión de dirección (2026-07-12): el **diagnóstico (`lib/legal`) es la única fuente
de verdad** del cumplimiento. Tanto el autodiagnóstico self-service como el consultor
(que aplica **la misma encuesta** en una reunión) llegan al mismo lugar: las mismas
brechas (`BreachDescriptor`: severidad, artículos, multa), ahora **persistidas por
empresa**. El proceso interno anterior (catálogo de `controls`, entrevista,
`assessment_controls`, evidencias-por-control, elegibilidad por % de controles,
recert fase 4) será **reemplazado y removido** por este modelo.

Este es el primer sub-proyecto de un programa mayor (cada uno con su propio ciclo
spec → plan → implementación):

1. **Modelo de diagnóstico persistido (ESTE spec).**
2. Diagnóstico asistido del consultor (aplica la misma encuesta).
3. Portal de Evaluaciones — detalle de brechas (por qué es riesgo / qué dice la ley / multa).
4. Infra de generación de documentos (HTML→PDF + QR).
5. Documentos de mitigación (por brecha + consolidado).
6. Resolución por el cliente (marcar resuelta → completar mitigación).
7. Documento final (catastro de evidencias) + certificado sobre el nuevo modelo.
8. Remoción de la maquinaria anterior.

Todo lo demás depende de este #1, que solo construye la **fundación de datos**.

## Objetivo

Persistir, por empresa, las brechas del diagnóstico como un registro inmutable en el
tiempo, poblado desde ambos caminos (self-service ahora; consultor en #2), sobre el
cual los sub-proyectos posteriores montan detalle, documentos, resolución y certificado.

## Modelo de datos

Migración nueva con dos tablas.

**`company_diagnoses`** — cabecera de una corrida del diagnóstico:
- `id uuid pk default gen_random_uuid()`
- `company_id uuid not null references public.companies(id)`
- `source text not null check (source in ('self_service','consultant_assisted'))`
- `answers jsonb not null` — respuestas del cuestionario (para auditoría y re-cálculo).
- `risk_level text not null` — nivel agregado (espejo de `RiskLevel`).
- `total_breaches integer not null default 0`
- `created_by uuid references auth.users(id)` — el consultor si es asistido; null en self-service.
- `status text not null default 'active' check (status in ('active','superseded'))`
- `created_at timestamptz not null default now()`
- Índices: `(company_id)`, y parcial `(company_id) where status='active'`.

**`diagnosis_breaches`** — una fila por brecha detectada (snapshot):
- `id uuid pk default gen_random_uuid()`
- `diagnosis_id uuid not null references public.company_diagnoses(id) on delete cascade`
- `breach_code text not null` — ej. `B-GOB-001`.
- `area text not null`, `area_label text not null`
- `severity text not null` — `critico|alto|medio|bajo`.
- `articles text[] not null default '{}'` — artículos Ley 21.719 (snapshot).
- `fine_min_utm integer`, `fine_max_utm integer` — rango de multa en UTM (snapshot).
- `description text not null` — texto de la brecha (snapshot).
- `dimension integer` — dimensión 1-10 del toolkit.
- `resolution_status text not null default 'open' check (resolution_status in ('open','resolved'))`
- `resolved_at timestamptz`
- `created_at timestamptz not null default now()`
- Índice: `(diagnosis_id)`.

**Principio de integridad (snapshot).** Al persistir se **congela** el contenido legal
de cada brecha (descripción, artículos, multa, severidad). Aunque `lib/legal` evolucione,
el registro de una empresa queda tal como se evaluó — los documentos y el certificado
(sub-proyectos posteriores) atestiguan un estado en un punto del tiempo ante fiscalizadores.

Tipos en `lib/supabase/types.ts` actualizados a mano (Row/Insert/Update de ambas tablas).

## RLS

- `company_diagnoses` y `diagnosis_breaches`: **SELECT para el cliente** acotado a su
  empresa (`company_id = current_company_id()`, y para breaches vía join al diagnóstico
  de su empresa). Sin INSERT/UPDATE/DELETE para el cliente (la escritura va por
  service-role en self-service, o por el consultor en #2).
- Consistente con el patrón de `client_rls` existente. El consultor (`is_consultant()`)
  podrá leer/escribir (se afina en #2; en #1 basta service-role para poblar).

## Lógica

**Función pura `computeDiagnosisSnapshot(answers)`** (nuevo módulo
`lib/diagnosis/snapshot.ts`):
- Entrada: las respuestas del cuestionario (screening + deep-dive) serializadas.
- Reconstruye el `FullDiagnosisResult` con el motor `lib/legal`
  (`walkScreening` + `computeFullDiagnosis` + `groupBreachesByAreaSeverity`).
- Salida: `{ riskLevel, totalBreaches, breaches: BreachSnapshot[] }`, donde
  `BreachSnapshot = { breachCode, area, areaLabel, severity, articles, fineMinUtm,
  fineMaxUtm, description, dimension }`.
- Unit-testeable (respuestas conocidas → brechas/severidad/multa esperadas).

**Función server `persistDiagnosis(companyId, answers, source, createdBy?)`**
(en `lib/diagnosis/persist.server.ts`, service-role):
1. `computeDiagnosisSnapshot(answers)`.
2. Marca la corrida `active` previa de esa empresa como `superseded`.
3. Inserta `company_diagnoses` (`active`) + las filas `diagnosis_breaches` (`open`).
4. Devuelve el `diagnosisId` (o un resultado tipado ok/error).
- No se confía en el cliente: las brechas SIEMPRE se recomputan de `answers` en servidor.

## Encaje con el flujo self-service (post-pago)

- El wizard (`components/self-assessment/diagnosis-wizard.tsx`) ya tiene las respuestas
  (`screeningAnswers` Map + `ddAnswers` Map). Se **serializan** y se envían en el payload.
- `registrationLeadSchema` gana un campo `answers` (validado con forma suficiente para
  recomputar; el servidor recomputa igual).
- En `registerAndStartCheckout`, tras `provisionCompany`, se llama
  `persistDiagnosis(company.id, answers, 'self_service')`. Se persiste **al registrarse**
  (la empresa ya existe; el pago solo controla qué VE el cliente, no si se persiste).
- El tramo **enterprise** (sin empresa, bajo cotización) no persiste diagnóstico.
- `companies.preliminary_panorama` se mantiene por ahora (lo usa el portal estado B);
  podrá derivarse de estas tablas en un sub-proyecto posterior. No se toca en #1.

## Alcance

**En #1:** las dos tablas + RLS + tipos; `computeDiagnosisSnapshot` (pura, con tests);
`persistDiagnosis` (server); enganche del self-service (payload con `answers` +
llamada en `registerAndStartCheckout`).

**Fuera de #1:** vista de detalle en el portal (#3), documentos (#4/#5), UI y semántica
de "marcar resuelta" (#6 — el campo `resolution_status` existe desde ya, pero el flujo
del cliente para cambiarlo es #6), herramienta del consultor (#2), certificado sobre el
nuevo modelo (#7), remoción de la maquinaria anterior (#8).

## Casos borde

- **Re-diagnóstico:** una nueva corrida marca la anterior `superseded` y crea filas
  nuevas `open` (no se arrastra el `resolution_status` previo; la semántica de recert se
  define en su sub-proyecto). Siempre hay a lo sumo una `active` por empresa.
- **Respuestas inválidas/insuficientes:** `computeDiagnosisSnapshot` opera sobre lo que
  el motor acepte; si el recompute no produce brechas, se persiste una corrida con
  `total_breaches = 0` (empresa sin brechas detectadas es un estado válido).
- **Fallo parcial de persistencia:** sin transacción (supabase-js no las expone); si
  falla el insert de brechas tras crear la cabecera, se loggea y se devuelve error (se
  tolera estado parcial, consistente con `createCompany`/`provisionCompany`).

## Pruebas

- **Unit (Vitest):** `computeDiagnosisSnapshot` — respuestas conocidas → conjunto de
  brechas esperado (códigos, severidad, rango de multa, área/areaLabel); caso sin brechas.
- **Integración:** la persistencia + enganche self-service se validan por E2E en el
  sub-proyecto que exponga el detalle en el portal (#3), siguiendo la convención del repo
  (no se mockea Supabase).
