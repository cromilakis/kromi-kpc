# Evaluación exhaustiva del cumplimiento + alertas — Diseño

**Fecha:** 2026-07-05
**Estado:** propuesta (pendiente de aprobación)
**Relacionado:** autocompletado desde transcripción, entrevista dinámica (aplicabilidad), guion de entrevista/cobertura.

## Problema

Tras interpretar la transcripción, quedan criterios en **"Sin evaluar"** (`unknown`).
Eso no debería pasar: la reunión (one-shot) debe **saldar cada criterio aplicable**.
Lo que inequívocamente no se pueda determinar de la transcripción debe quedar como
**alerta dentro de la evaluación**, no en silencio.

## Objetivo

Que, al aplicar la interpretación de una transcripción, **cada criterio de cada
control aplicable** quede en uno de estos estados — nunca en "Sin evaluar" por
omisión:
- **Cumple / Parcial / No cumple** (determinable, con cita).
- **Requiere aclaración (alerta)** — el LLM no pudo determinarlo de la
  transcripción; queda marcado explícitamente con el motivo, como alerta visible.

"Sin evaluar" queda SOLO como el estado inicial, antes de cualquier entrevista.

## Cambios

### 1. Estado nuevo de criterio: `flagged` ("Requiere aclaración")
- `criterionAnswerSchema` (`lib/interview/answers-schema.ts`) + `CriterionAnswer`
  (`lib/interview/auto-map.ts`): agregar `"flagged"`.
  Queda: `yes | partial | no | unknown | flagged`.
- `unknown` = "Sin evaluar" (inicial). `flagged` = "Requiere aclaración" (alerta,
  ámbar), tras un intento de interpretación que no pudo determinar el criterio.

### 2. Extracción exhaustiva (LLM)
- El prompt debe instruir: para CADA control aplicable, pronunciarse sobre TODOS
  sus criterios (no solo los que puede responder). Por cada criterio: veredicto
  (yes/partial/no) con cita textual, o `no_determinado` con motivo.
- Contrato de salida (`lib/llm/extract-diagnosis.ts`):
  - `compliance[]` sigue siendo `{controlCode, criterionIndex, answer: yes|partial|no, evidence}` (determinables).
  - NUEVO `alerts[]`: `{controlCode, criterionIndex, reason}` — criterios aplicables
    que el LLM no pudo determinar. (Determinismo: NO se inventa veredicto; se marca.)
  - Sanitizado: valida controlCode/criterionIndex igual que compliance; descarta los inválidos a `unassigned`.
- El catálogo que recibe el LLM ya está filtrado por aplicabilidad (feature previa),
  así que "todos los criterios aplicables" = los criterios de los controles del prompt.

### 3. Aceptación / cobertura
- En `ExtractionReview`: además de RAT y cumplimiento, un grupo **"Requiere
  aclaración"** que lista los `alerts` (control + criterio + motivo) con acción
  "Aceptar" (setea ese criterio a `flagged`) / "Descartar". "Aceptar todo" por grupo.
- Al aceptar cumplimiento + alertas, cada criterio aplicable queda con estado
  (answer o `flagged`) → **cero "Sin evaluar"** tras aplicar. `onAcceptCompliance`
  se extiende para aceptar `flagged`.

### 4. UI de evaluación (`ComplianceForm`)
- El criterio con `flagged` se muestra como **alerta** (badge/opción "Requiere
  aclaración", ámbar) — distinto visualmente de "Sin evaluar". El consultor puede
  cambiarlo a un veredicto si luego lo aclara (o subir transcripción complementaria).

### 5. Estado del control + materialización
- `mapAnswersToControlStatus` (`auto-map.ts`): `flagged` se trata como **no
  resuelto** para el estado del control (no cuenta como compliant ni non_compliant;
  como `unknown` para el cómputo), pero es un gap CONOCIDO (a diferencia de unknown).
- `materializeDiagnosis` / `selectControlUpdates`: sin cambio de lógica de estado
  (flagged no genera un `control_result` compliant/partial/non_compliant). Documentar
  que `flagged` es señal de revisión, no un veredicto de cumplimiento.
- (Opcional, posterior) indicador de alerta en el checklist para controles con
  criterios `flagged`.

## Determinismo (se mantiene)
- El LLM NO inventa veredictos: si no puede determinar, marca `alerta` con motivo.
- El humano revisa/acepta; nada se auto-aplica sin confirmación.
- La cita textual sigue siendo obligatoria para los veredictos.

## Testing
- Unit: `criterionAnswerSchema` acepta `flagged`; `sanitizeExtraction` valida `alerts`
  (descarta inválidos); `mapAnswersToControlStatus` con `flagged`.
- E2E: aplicar la transcripción enriquecida de Margarita → tras aceptar, 0 criterios
  "Sin evaluar"; los no determinables quedan "Requiere aclaración".

## Decisiones pendientes
1. Nombre del estado en UI: "Requiere aclaración" vs "Alerta" vs "Por confirmar".
2. ¿`flagged` cuenta distinto de `unknown` en la barra de avance del checklist? (v1: igual que unknown / no cubierto.)
3. ¿Indicador de alerta en el checklist del consultor? (posterior.)
