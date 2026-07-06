# Guion guiado de entrevista (árbol de decisión determinista) — Diseño

**Fecha:** 2026-07-06
**Estado:** aprobado (diseño)
**Relacionado:** diagnóstico (`DiagnosisManager`, `ComplianceForm`), modelo de respuestas
(`answers.compliance` / `answers.applicability`), aplicabilidad
(`lib/interview/applicability.ts`, `select-not-applicable.ts`), catálogo de
controles/criterios, "Aplicar diagnóstico" (`materializeDiagnosis`).

## Visión

Una entrevista **guiada por un script determinista** (tipo guion de ventas):
preguntas de **opción múltiple** encadenadas que ramifican según las respuestas
y los factores de la empresa, y que **escriben directo** el borrador del
diagnóstico (`answers.compliance` + factores). Rápida, trazable, sin IA ni
transcripción. Cuando ninguna opción calza, hay **"Otros"** (texto libre) que
deja el tema como *Requiere aclaración*.

La IA/transcripción (Fase 3) queda como **modo alternativo** para reuniones
libres; el guion es el **camino principal y recomendado**. El **checklist manual**
por dominios se conserva para ajustes finos.

## Principio rector

Determinista, cero asunciones. Cada respuesta mapea a criterios concretos
(yes/partial/no/flagged) y/o factores. Nada se auto-aplica al expediente: el
gate humano ("Aplicar diagnóstico") se mantiene. El **Complexity Score nunca** se
expone al cliente.

## Decisiones tomadas

1. **Dónde vive el guion:** archivo de datos versionado (repo). Migrar a BD
   editable cuando el contenido se estabilice y el abogado lo valide.
2. **Granularidad:** preguntas "madre" — una pregunta puede resolver varios
   criterios y ramificar (entrevista más ágil).
3. **Quién responde:** v1 = consultor. Self-service del cliente en el portal =
   fase siguiente (mismo guion, textos no técnicos).
4. **Respuestas:** opción múltiple, con "Otros" (texto libre) cuando no calza.

## Modelo de datos (config, `lib/interview/script/`)

```ts
type CriterionAnswer = "yes" | "partial" | "no" | "flagged";

/** Efecto de elegir una opción sobre el borrador del diagnóstico. */
interface OptionEffect {
  /** Criterios de cumplimiento que setea. */
  sets?: Array<{ control: string; criterion: number; answer: CriterionAnswer }>;
  /** Factores de la empresa que declara (para aplicabilidad / ramas). */
  factors?: string[];
}

interface ScriptOption {
  id: string;
  label: string;                 // texto de la opción (multiple choice)
  effect?: OptionEffect;
}

/** Condición para mostrar un nodo (rama dinámica). Se evalúa contra las
 * respuestas acumuladas (por nodo → opción(es) elegidas) y los factores. */
type ScriptCondition =
  | { anyOption: { node: string; options: string[] } } // se eligió alguna de esas opciones en ese nodo
  | { hasFactor: string }
  | { not: ScriptCondition }
  | { all: ScriptCondition[] }
  | { any: ScriptCondition[] };

interface ScriptNode {
  id: string;
  question: string;              // texto para el consultor
  clientQuestion?: string;       // texto no técnico (portal; fase siguiente)
  help?: string;
  multi?: boolean;               // permite elegir varias opciones
  allowOther?: boolean;          // muestra "Otros" (texto libre)
  /** Criterios que este nodo "cubre": si el usuario elige "Otros" o no hay
   * efecto que los resuelva, quedan en 'flagged' (Requiere aclaración). */
  covers?: Array<{ control: string; criterion: number }>;
  condition?: ScriptCondition;   // se muestra solo si pasa
  options: ScriptOption[];
}

interface Script {
  id: string;
  title: string;
  nodes: ScriptNode[];           // orden = orden de presentación
}
```

## Motor (`lib/interview/script/engine.ts`, puro y testeable)

- `nextNode(script, state, factors)`: primer nodo **no respondido** cuya
  `condition` pasa (o null si terminó). Determinista.
- `applyAnswer(node, selectedOptionIds, otherText, draft)`: por cada opción
  elegida aplica su `effect` (setea criterios en `answers.compliance` y factores
  en `answers.applicability`/`factors`). Si se eligió **"Otros"**, o si algún
  criterio de `node.covers` quedó sin veredicto, esos criterios se marcan
  **`flagged`** y el texto libre se guarda como nota (Requiere aclaración).
- `evalCondition(condition, state, factors)`: evaluación pura de la rama.
- Estado del guion: `answers.script = { [nodeId]: { options: string[], other?: string } }`
  (se persiste en `interview_sessions.answers` junto al resto; permite reanudar).

Todo escribe en el **mismo `answers`** que ya usan checklist y materialize; el
guion es una capa de captura, no un modelo nuevo.

## UI (`components/interview/guided-script.tsx`, client)

- Panel "Entrevista guiada": muestra el **nodo actual** (pregunta + opciones como
  botones grandes de opción múltiple + "Otros" con textarea). Al responder,
  aplica el efecto al borrador y avanza al siguiente nodo.
- **Progreso**: "Tema X de N" / "faltan N por cubrir" (según nodos aplicables).
- **Navegación**: Atrás (re-abrir un nodo respondido y cambiar la respuesta →
  recomputa desde ahí), y "Saltar" (deja los `covers` en flagged).
- Los criterios se van reflejando en el checklist (tabs por dominio) ya existente;
  se puede alternar guion ↔ checklist manual.
- Montada en `DiagnosisManager` como el modo principal del diagnóstico.

## "Otros" / texto libre

Nunca inventa veredicto. Marca los criterios cubiertos por el nodo como
`flagged` y guarda el texto en `answers.script[nodeId].other`. El consultor lo
resuelve luego (en el checklist o re-respondiendo).

## Contenido del guion (v1, borrador)

Un primer guion que cubra los controles **baseline** (los que aplican siempre),
con preguntas madre que mapeen a sus criterios. Marcado **pendiente de validación
consultor/abogado** (igual que `interview_questions`). Los controles condicionales
(sensibles, transferencias, decisiones automatizadas) se abren por rama según los
factores declarados.

## Modelo de datos / persistencia

- Sin migración: `answers.script` es un objeto más dentro de
  `interview_sessions.answers` (jsonb). `normalize-answers` y el schema Zod se
  extienden para aceptarlo sin perderlo al recargar.

## Determinismo, seguridad, auditoría

- Motor puro y testeable (Vitest): mismas respuestas → mismo borrador.
- Escribe solo el borrador; gate humano en "Aplicar diagnóstico". Sin exponer
  el Complexity Score al cliente.
- Contenido (preguntas/mapeos) pendiente de abogado.

## Fuera de v1 / posterior

- Self-service del cliente en el portal (textos no técnicos + gate de revisión).
- Edición del guion en BD (editor visual del árbol).
- Mapear opciones a actividades del RAT (v1 se enfoca en cumplimiento + factores;
  el RAT sigue en su tabla/ficha).

## Alcance v1

1. Tipos + motor puro (`engine.ts`) con tests.
2. Extender `answers` (schema/normalize) para `script`.
3. UI `guided-script.tsx` (opción múltiple + Otros + progreso + atrás) montada en
   el diagnóstico del consultor, escribiendo el borrador; checklist manual
   conservado.
4. Guion borrador de controles baseline (contenido, pendiente abogado).
