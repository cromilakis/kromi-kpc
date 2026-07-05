# Fase 4 v1 — Solicitud de re-certificación + consentimiento + routing — Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Pasos con checkbox (`- [ ]`).

**Goal:** El cliente, cuando su certificado está por vencer/vencido, puede **solicitar la re-certificación** desde el portal aceptando un consentimiento; el sistema abre un nuevo ciclo de evaluación, decide el **routing por tramo** (bajo = candidata a self-service; medio/alto/crítico = revisión del consultor) y el consultor ve la solicitud en `/app`. La IA/emisión no cambian.

**Alcance (honesto):** v1 = solicitud + consentimiento + apertura de ciclo + routing + visibilidad consultor. La **entrevista self-service completa cliente-facing** (que el cliente del tramo bajo llene RAT/cumplimiento en el portal) es **Fase 4b** (incremento siguiente) — requiere re-montar el flujo de entrevista para el cliente autenticado con actions gateadas, pieza grande aparte.

**Architecture:** Server action gateada (verifica dueño con el cliente autenticado, escribe con service-role, como Fases 2-3). Nuevo ciclo = fila `assessments` con `origin='client_recert'`. Consentimiento (texto placeholder legal) registrado en `audit_log`. El tramo (Complexity Score, interno) se calcula server-side y solo devuelve el routing — nunca se expone el score.

**Tech Stack:** Next.js 16 (server actions), Supabase (RLS + service-role), Zod, Vitest.

**Relacionado:** propuesta `2026-07-05-recertification-phase4-design.md`; Fase 1 (`certificateStanding`); Fase 0 (RLS cliente).

## Global Constraints

- **La IA/flujo self-service nunca emite** el certificado. v1 no toca emisión.
- **Score interno**: el tramo se calcula server-side; al cliente solo se le devuelve `gate` ('self_service_pending' | 'consultant_review'), nunca el score/tramo.
- **Escritura gateada por service-role** tras verificar pertenencia con el cliente autenticado (patrón Fases 2-3). El cliente no tiene INSERT en `assessments`/`audit_log`.
- **Consentimiento**: se registra versión del texto + timestamp en `audit_log` (`recert.consent_accepted`). Texto = placeholder `TODO-LEGAL` en i18n, reemplazable sin código.
- **Doctrina**: `"use server"` + Zod + auth + audit; i18n (`portal`/`companies`); prosa español, código inglés.
- **Tailwind spacing**: tokens definidos o px arbitrarios; nunca -6/-10/-14. cursor-pointer.
- **No romper**: consultor + `pnpm test`/`test:rls` verdes.

---

### Task 1: Migración `assessments.origin` + helper de gate + consentimiento

**Files:**
- Create: `supabase/migrations/20260706120000_assessment_origin.sql`
- Create: `lib/recert/gate.ts` (helper puro + versión del consentimiento)
- Modify: `lib/supabase/types.ts` (regenerado)
- Test: `test/recert/gate.test.ts`

**Interfaces (Produces):**
- Columna `assessments.origin text not null default 'consultant'` con check `in ('consultant','client_recert')`.
- `lib/recert/gate.ts`:
  - `export type RecertGate = "self_service_pending" | "consultant_review";`
  - `export function recertGate(scoreTier: "low"|"medium"|"high"|"critical"): RecertGate` — `low` → `self_service_pending`; resto → `consultant_review`.
  - `export const RECERT_CONSENT_VERSION = "v1-placeholder";` (marca que el texto es placeholder legal).

- [ ] **Step 1: Migración** — `alter table public.assessments add column if not exists origin text not null default 'consultant' check (origin in ('consultant','client_recert'));` + comment. Aplicar en local (`docker exec -i ... < archivo`), verificar `\d assessments`.
- [ ] **Step 2: Regenerar tipos** (`pnpm supabase gen types typescript --local`, stderr aparte / Bash tool). `pnpm typecheck` OK.
- [ ] **Step 3: Test** de `recertGate` (low→self_service_pending; medium/high/critical→consultant_review).
- [ ] **Step 4: Implementar** `lib/recert/gate.ts` (puro).
- [ ] **Step 5: Correr** test → PASS.
- [ ] **Step 6: Commit** — `feat(recert): assessments.origin + helper de gate por tramo`

---

### Task 2: Server action `requestRecertification`

**Files:**
- Create: `lib/actions/recert.ts`
- Test: `test/recert/request.test.ts`

**Interfaces (Produces):**
- `requestRecertification(consentVersion: string): Promise<RequestRecertResult>` con
  `type RequestRecertResult = { ok: true; gate: RecertGate } | { ok: false; error: "validation"|"unauthorized"|"not_eligible"|"already_open"|"unavailable" }`.
  - `"use server"`, Zod (`consentVersion` === `RECERT_CONSENT_VERSION`, si no → validation).
  - getUser; con el cliente autenticado obtener su empresa (`company_client_view.id`); null → unauthorized.
  - Verificar que el certificado está `por_vencer`/`vencida` (reusa `certificateStanding` + el certificado más reciente leído con el cliente autenticado). Si `vigente` o `sin_certificado` → `not_eligible` (no tiene sentido re-certificar aún). (Documentar: sin_certificado se maneja por el diagnóstico inicial, no por recert.)
  - Con **service-role**: leer el `complexity_score` de la empresa (columna interna) → derivar `scoreTier` (reusa `scoreTierOf` de `lib/companies/scoring.server.ts`) → `gate = recertGate(tier)`.
  - Idempotencia: si ya hay un `assessments` abierto con `origin='client_recert'` para la empresa → `already_open` (no abrir otro). Si no, insertar nuevo ciclo (cycle = max+1, status 'open', origin 'client_recert') con service-role.
  - Registrar consentimiento + solicitud en `audit_log` (`recert.consent_accepted` con `{version}` y `recert.requested` con `{assessment_id, gate}`).
  - Devolver `{ ok:true, gate }` (nunca el score/tramo).

- [ ] **Step 1: Test** (supabase + service-role mockeados, patrón proposals/evidences): consentVersion inválido → validation; sin empresa → unauthorized; cert vigente → not_eligible; ya hay ciclo client_recert abierto → already_open; happy path bajo → abre ciclo origin client_recert + audita + gate self_service_pending; happy path crítico → gate consultant_review.
- [ ] **Step 2: Correr y ver fallar.**
- [ ] **Step 3: Implementar** (mira `lib/actions/proposals.ts` para el patrón gateado + `lib/portal/load-dashboard.server.ts` para leer el cert del cliente; `lib/companies/scoring.server.ts` para `scoreTierOf`).
- [ ] **Step 4: Correr** → PASS. typecheck OK.
- [ ] **Step 5: Commit** — `feat(recert): requestRecertification (gateada, abre ciclo, routing por tramo)`

---

### Task 3: UI del portal — tarjeta de re-certificación

**Files:**
- Modify: `app/portal/page.tsx` (+ `lib/portal/load-dashboard.server.ts` si conviene exponer si ya hay recert abierta) + `components/portal/recert-card.tsx` (nuevo) + `messages/app/portal.json`

**Interfaces:** consume `certificateStanding` (ya cargado en el dashboard) + `requestRecertification`.

- [ ] **Step 1: i18n** `portal.recert.*`: título, explicación, **texto de consentimiento placeholder** (`consentText` con nota interna de que es TODO-LEGAL), checkbox "Acepto…", botón "Iniciar re-certificación", mensajes de resultado por gate (`self_service_pending` → "Tu re-evaluación fue iniciada; pronto podrás completarla" (Fase 4b) / o "En preparación"; `consultant_review` → "Nuestro equipo revisará tu re-certificación y te contactará"), y errores (`not_eligible`, `already_open`).
- [ ] **Step 2:** `recert-card.tsx` (client component): se muestra SOLO cuando el standing es `por_vencer`/`vencida` (pásalo como prop desde la page que ya calcula standing). Checkbox de consentimiento (obligatorio para habilitar el botón) + botón "Iniciar re-certificación" (useTransition → `requestRecertification(RECERT_CONSENT_VERSION)`); muestra el mensaje según `gate` o el error.
- [ ] **Step 3:** montar en `app/portal/page.tsx` (bajo el dashboard). Spacing tokens válidos; cursor-pointer.
- [ ] **Step 4:** typecheck + build + `pnpm test`/`test:rls` verdes.
- [ ] **Step 5: Commit** — `feat(portal): tarjeta de solicitud de re-certificación`

---

### Task 4: Visibilidad para el consultor

**Files:**
- Modify: `app/app/companies/[id]/page.tsx` (o donde liste ciclos) + `messages/app/companies.json`

**Interfaces:** lee `assessments.origin`.

- [ ] **Step 1:** En la ficha de empresa (consultor), cuando el `assessment` abierto más reciente tiene `origin='client_recert'`, mostrar un aviso "Re-certificación solicitada por el cliente" (StatusBadge/nota) para que el consultor la tome (el flujo de diagnóstico/evaluación en `/app` ya existe). i18n.
- [ ] **Step 2:** typecheck + build verdes.
- [ ] **Step 3: E2E click-through (orquestador):** crear cliente + empresa con cert `por_vencer` + score bajo → login cliente → tarjeta recert → aceptar consentimiento → Iniciar → mensaje self_service_pending + en DB un `assessments` origin='client_recert' abierto + audit `recert.consent_accepted`/`recert.requested`; repetir con score crítico → gate consultant_review; como consultor, ver el aviso "Re-certificación solicitada". Screenshot.
- [ ] **Step 4: Commit** — `feat(companies): aviso de re-certificación solicitada por el cliente`

---

## Self-review

- **Cobertura del alcance v1:** origin+gate (T1), requestRecertification (T2), UI portal (T3), visibilidad consultor (T4). ✓
- **Seguridad:** score nunca al cliente (solo gate); escritura gateada por service-role; consentimiento auditado. ✓
- **No emite:** v1 no toca emisión de certificados. ✓
- **Sin placeholders funcionales** (solo el texto legal, marcado a propósito). ✓

## Handoff

Ejecutar con **subagent-driven-development**, T1→T4. Al terminar: gate + merge + `supabase db push` (migración T1) + deploy. **Fase 4b** (entrevista self-service cliente-facing para tramo bajo) queda como plan posterior; el texto legal, cadencia/cron y CLP se ajustan cuando estén.
