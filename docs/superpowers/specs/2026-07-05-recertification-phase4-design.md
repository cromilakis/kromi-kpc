# Fase 4 — Auto-recertificación asistida — Diseño (propuesta)

**Fecha:** 2026-07-05
**Estado:** propuesta para avanzar (los ítems legales/CLP van como placeholders a ajustar después, por decisión del usuario: "armemos para avanzar y vamos ajustando").
**Relacionado:** épica `2026-07-05-company-accounts-portal-design.md`; reusa entrevista dinámica + autocompletado LLM + pricing.

## Objetivo

Que, al acercarse el vencimiento del certificado, la empresa cliente pueda
**re-evaluarse de forma asistida** desde el portal, con la IA preparando el
borrador (entrevista dinámica + transcripción) y un **gate humano por tramo**.
La IA **nunca emite** el certificado: prepara y marca deltas/riesgos; la emisión
mantiene sus reglas de elegibilidad y/o la revisión del consultor.

## Principio rector

Sin el consultor como filtro en el tramo bajo, el determinismo debe ser **más**
estricto, no menos: reusar todas las garantías ya construidas (temp 0, evidencia
obligatoria, "sin asignar", validación Zod, revisión humana del propio cliente)
y **nunca** auto-emitir un certificado.

## Separación: construir ya vs. ajustar después

### ✅ Se puede construir ya (sin bloqueos)
1. **Detección de vencimiento + estado "por vencer"**: ya existe `certificateStanding`
   (Fase 1) con `por_vencer` (≤60 días). El portal muestra un CTA "Iniciar
   re-certificación" cuando el certificado está `por_vencer`/`vencida`.
2. **Flujo de re-evaluación cliente-facing (borrador)**: reusa la entrevista
   dinámica + el autocompletado desde transcripción, pero montado en `/portal`
   para el cliente. Produce un **borrador de re-evaluación** (nuevo ciclo de
   `assessments`), NUNCA un certificado.
3. **Gate por tramo (routing)**: el tramo del Complexity Score decide el camino:
   - **bajo** → self-service asistido: el cliente completa, y al terminar queda
     "listo para emisión" sujeto a las **reglas duras de elegibilidad ya
     existentes** (`computeEligibility`).
   - **alto/crítico** → queda en estado "en revisión del consultor"; el consultor
     revisa en `/app` antes de emitir. (El routing es determinista por tramo.)
4. **La IA nunca emite**: la emisión del certificado sigue pasando por la ruta
   actual (`lib/certificates/issue.server.ts` + elegibilidad). Fase 4 solo
   habilita "solicitar/preparar", no cambia quién/cómo emite.
5. **Consentimiento con placeholder**: antes de una re-certificación self-service,
   el cliente acepta un texto de consentimiento. **Placeholder marcado
   `TODO-LEGAL`** (ver abajo), editable sin tocar código (i18n / tabla de
   config), para reemplazar por el texto del abogado.
6. **Notificación in-app** del vencimiento (badge/aviso en el portal). El email
   automático puede venir después.

### ⏳ Requiere ajuste/decisión posterior (no bloquea lo de arriba)
- **Texto legal del consentimiento self-service** (abogado) — hoy placeholder.
- **Cadencia automática por cron** (disparo + email al acercarse `valid_until`):
  se puede añadir después; v1 usa el CTA in-app cuando el estado es por_vencer.
  (Requiere un scheduler; Vercel Cron es la opción — decisión posterior.)
- **Montos CLP** de la recert (si se cobra la renovación) — hipótesis del spec de
  pricing, a validar antes de cobrar de verdad.
- **Umbral exacto del gate por tramo** (qué tramos son self-service) — arranca
  con "bajo = self-service; medio/alto/crítico = revisión", ajustable.

## Modelo (incremental sobre lo existente)

- **Sin tablas nuevas necesarias para el núcleo**: la re-evaluación es un nuevo
  ciclo de `assessments` (ya soportado por `createDiagnosisSession`, que abre
  ciclo max+1). La sesión de entrevista ya existe (`interview_sessions`).
- **Nuevo estado de la sesión / recert**: para distinguir "self-service listo"
  vs "en revisión del consultor", usar el `interview_sessions.status` existente
  (`draft|in_progress|submitted|reviewed`) + el tramo; o una columna
  `recert_gate text` en la sesión (decisión del plan). Preferible reusar
  `submitted` = cliente terminó, pendiente de la ruta por tramo.
- **Consentimiento**: registrar la aceptación (timestamp + versión del texto) en
  una fila de `audit_log` (`recert.consent_accepted`) — auditable, sin tabla
  nueva. Si se requiere no-repudio fuerte, una tabla `consents` después.

## Flujo (v1, sin bloqueos)

1. Portal detecta `por_vencer`/`vencida` → CTA "Iniciar re-certificación".
2. Cliente acepta el **consentimiento** (placeholder legal) → se registra en audit.
3. Se abre una sesión de diagnóstico (nuevo ciclo) en modo cliente; el cliente
   responde la **entrevista dinámica** (solo lo aplicable) y puede pegar una
   **transcripción** para autocompletar (con revisión, como hoy).
4. Al enviar:
   - **tramo bajo**: se materializa el borrador; la elegibilidad se evalúa con
     las reglas duras existentes; si cumple, queda "listo para emisión"
     (self-service); la emisión efectiva sigue la ruta actual.
   - **tramo alto/crítico**: queda `submitted` → el consultor lo revisa y emite
     en `/app` (flujo actual).
5. En ningún caso la IA emite el certificado.

## Seguridad / RLS

- El cliente opera SOLO sobre su empresa (RLS de Fase 0). La materialización y la
  emisión que tocan tablas internas van por server actions gateadas (verificar
  pertenencia con el cliente autenticado; escribir con service-role donde el
  cliente no tiene policy), mismo patrón que Fases 2-3.
- El consentimiento y cada transición quedan en `audit_log`.

## Testing

- Unit: routing por tramo (bajo→self-service, alto/crítico→revisión); el
  consentimiento se exige antes de iniciar; la IA nunca llama a emisión.
- Integración: la re-evaluación abre un nuevo ciclo sin tocar el certificado
  vigente; elegibilidad reusa `computeEligibility`.
- E2E click-through: cliente por_vencer → consentimiento → entrevista → enviar;
  tramo bajo llega a "listo/elegible"; tramo alto queda en revisión del consultor.

## Decisiones para el plan
1. Estado de la recert: reusar `interview_sessions.status` (`submitted`) vs
   columna `recert_gate` nueva.
2. Umbral del gate por tramo (qué tramos son self-service).
3. Registro de consentimiento: `audit_log` (v1) vs tabla `consents` (no-repudio).
4. Cadencia: CTA in-app (v1) vs Vercel Cron + email (posterior).
5. Texto legal del consentimiento (placeholder → abogado).
6. ¿Se cobra la recert? (engancha con pricing; CLP a validar).
