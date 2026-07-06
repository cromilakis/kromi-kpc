/**
 * Mapeo DETERMINISTA gap → acción de mitigación (sin LLM). Cada criterio de
 * verificación del catálogo (`controls.verification_criteria`, ver
 * `supabase/seed.sql`) describe un estado-objetivo; su remediación es la forma
 * imperativa de alcanzarlo. Este módulo redacta esa acción una vez por criterio
 * y deriva prioridad/esfuerzo/plazo por regla, reemplazando la antigua llamada a
 * DeepSeek (`proposeRemediation`).
 *
 * BORRADOR v1 — PENDIENTE validación consultor/abogado: los textos de acción son
 * una primera propuesta trazable 1:1 al criterio incumplido (cero asunciones: no
 * inventan hechos de la empresa). El consultor edita cada tarjeta antes de
 * aceptarla al Plan de adecuación.
 *
 * Config versionada en código (misma doctrina que el guion `rat-script.ts`): sin
 * migración; la trazabilidad al plan (control_code + criterion_index) ya vive en
 * `remediation_items`. Las claves y el orden calzan con `verification_criteria`
 * por índice — al editar el catálogo, mantener ambos alineados.
 */

export type GapType = "no" | "partial" | "flagged";
export type Priority = "alta" | "media" | "baja";
export type Effort = "bajo" | "medio" | "alto";

/** Criterio incumplido del diagnóstico (lo arma `buildGaps`). */
export interface RemediationGap {
  controlCode: string;
  controlName: string;
  criterionIndex: number;
  criterion: string;
  gapType: GapType;
}

/** Acción de mitigación propuesta para un gap (misma forma que consumía la UI). */
export interface ProposalItem {
  controlCode: string;
  criterionIndex: number;
  gapType: GapType;
  action: string;
  priority: Priority;
  effort: Effort;
  suggestedDueWeeks: number;
  rationale: string;
}

/**
 * Acción por control, alineada por índice con `verification_criteria`. Un texto
 * imperativo, concreto y anclado al criterio (sin datos inventados).
 */
const REMEDIATION_MAP: Record<string, readonly string[]> = {
  "DPC-LIC-001": [
    "Identificar y documentar la base de licitud de cada finalidad de tratamiento del RAT.",
    "Rediseñar los formularios y flujos de captura para obtener el consentimiento de forma libre, informada, específica y explícita (sin casillas premarcadas).",
    "Implementar un mecanismo operativo y accesible para que el titular revoque su consentimiento.",
    "Actualizar los avisos de privacidad y el banner de cookies para cumplir las exigencias de la Ley 19.496 (SERNAC).",
  ],
  "DPC-FIN-001": [
    "Declarar una finalidad determinada y explícita para cada tratamiento del RAT.",
    "Informar la finalidad al titular al momento de recolectar y verificar su legitimidad.",
    "Establecer controles que impidan reutilizar datos con fines incompatibles sin nueva base o consentimiento.",
    "Documentar y comunicar al titular todo cambio de finalidad.",
  ],
  "DPC-FIN-002": [
    "Elaborar una matriz de plazos de retención por categoría de dato.",
    "Fundamentar cada plazo de retención en una obligación legal o en la finalidad del tratamiento.",
    "Implementar un procedimiento de borrado seguro y verificable que alcance también copias y respaldos.",
    "Programar y registrar depuraciones periódicas de datos vencidos.",
  ],
  "DPC-PRO-001": [
    "Justificar cada campo recolectado frente a una finalidad concreta y eliminar los que no la tengan.",
    "Revisar formularios y sistemas para dejar de solicitar datos innecesarios o excesivos.",
    "Establecer una revisión periódica que depure atributos que ya no se utilizan.",
    "Adoptar seudonimización o agregación cuando sea suficiente para la finalidad.",
  ],
  "DPC-CAL-001": [
    "Definir procesos de actualización periódica de los datos.",
    "Establecer un procedimiento de rectificación con un plazo definido de aplicación.",
    "Implementar controles para detectar y corregir duplicados e inconsistencias.",
    "Depurar periódicamente los registros vencidos o sin finalidad vigente.",
  ],
  "DPC-RES-001": [
    "Emitir un acto formal (acta o resolución) que designe nominalmente al Delegado de Protección de Datos (DPD).",
    "Asegurar que el DPD reporte directamente a la alta dirección, sin conflictos de interés.",
    "Elaborar el descriptor de cargo del DPD con funciones, atribuciones y líneas de escalamiento.",
    "Asignar presupuesto y tiempo dedicado para el ejercicio del rol de DPD.",
  ],
  "DPC-RES-002": [
    "Redactar una política de gobierno de datos que cubra principios, roles, finalidades y reglas de tratamiento.",
    "Someter la política de tratamiento a aprobación formal del directorio o la máxima autoridad.",
    "Versionar la política y fijar un ciclo de revisión con fecha vigente.",
    "Comunicar y publicar la política para que sea accesible a todo el personal.",
  ],
  "DPC-RES-003": [
    "Centralizar las evidencias de cumplimiento en un repositorio único indexado por control.",
    "Registrar versión, fecha y responsable en cada evidencia.",
    "Garantizar la disponibilidad inmediata de la prueba ante requerimientos multi-agencia.",
    "Implementar control de acceso y trazabilidad sobre el repositorio de evidencias.",
  ],
  "DPC-RES-004": [
    "Formular un Modelo de Prevención de Infracciones (MPI) que cubra gobernanza, DPD, inventario, matriz de riesgos y gestión de terceros.",
    "Obtener la aprobación formal del MPI por la alta dirección.",
    "Designar un responsable del MPI y un plan de mitigación con seguimiento.",
    "Volver operativo y auditable el MPI, más allá de lo declarativo.",
  ],
  "DPC-SEG-001": [
    "Implementar un modelo de accesos por rol bajo el principio de mínimo privilegio.",
    "Registrar consultas, modificaciones y eliminaciones de datos personales.",
    "Configurar bitácoras inalterables con un plazo de conservación definido.",
    "Establecer revisión periódica y revocación oportuna de accesos.",
  ],
  "DPC-SEG-002": [
    "Cifrar los datos en tránsito (TLS) y en reposo con estándares vigentes.",
    "Activar autenticación multifactor (MFA) en los accesos críticos.",
    "Aplicar técnicamente una política de contraseñas robustas.",
    "Establecer respaldos periódicos, aislados y probar su restauración.",
  ],
  "DPC-TRA-001": [
    "Publicar la política de tratamiento y mantenerla accesible al público.",
    "Incluir en la política la fecha, versión e individualización del responsable.",
    "Redactar la información al titular de forma clara, precisa e inequívoca.",
    "Actualizar la política cuando cambien los tratamientos o la normativa.",
  ],
  "DPC-CON-001": [
    "Hacer que el personal con acceso a datos firme compromisos de confidencialidad.",
    "Incorporar cláusulas de secreto que subsistan tras el término de la relación.",
    "Capacitar al personal sobre el deber de confidencialidad.",
    "Extender las cláusulas de confidencialidad a encargados y terceros.",
  ],
  "DPC-INV-001": [
    "Levantar el RAT cubriendo todos los procesos de negocio que tratan datos personales.",
    "Registrar en cada actividad la finalidad, categorías de datos, base de licitud y plazo de retención.",
    "Identificar sistemas, ubicaciones y responsables de cada base de datos.",
    "Establecer la actualización del RAT ante nuevos tratamientos o cambios relevantes.",
  ],
  "DPC-INV-002": [
    "Elaborar un diagrama del ciclo de vida del dato de extremo a extremo.",
    "Identificar todas las transferencias hacia terceros y hacia el extranjero.",
    "Amparar cada transferencia internacional con un mecanismo de resguardo válido.",
    "Documentar el punto y método de eliminación al final del ciclo de vida.",
  ],
  "DPC-DER-001": [
    "Habilitar un canal formal, visible y exclusivo para solicitudes ARCOP.",
    "Definir un procedimiento de verificación de identidad del solicitante.",
    "Asegurar el cumplimiento de los plazos legales de respuesta con registro de cada gestión.",
    "Asignar responsables internos para tramitar cada tipo de derecho ARCOP.",
  ],
  "DPC-SEN-001": [
    "Justificar y documentar el tratamiento biométrico en un anexo contractual.",
    "Almacenar las plantillas biométricas cifradas de forma irreversible (hash).",
    "Ofrecer una alternativa de marcación para trabajadores que no consientan la biometría.",
    "Definir un enrolamiento controlado y la eliminación al término de la relación laboral.",
  ],
  "DPC-TER-001": [
    "Levantar y mantener un inventario actualizado de encargados y sub-encargados.",
    "Suscribir con cada encargado crítico un contrato con cláusulas de tratamiento de datos.",
    "Evaluar el nivel de seguridad del proveedor antes de contratarlo.",
    "Regular en el contrato la confidencialidad, la gestión de brechas y la devolución/eliminación de datos.",
  ],
  "DPC-TER-002": [
    "Identificar todas las transferencias internacionales de datos.",
    "Amparar cada transferencia con un mecanismo de resguardo válido conforme a la ley.",
    "Incluir garantías de adecuación en los contratos con destinatarios en el extranjero.",
    "Documentar el país de destino y su nivel de protección.",
  ],
  "DPC-INC-001": [
    "Elaborar un manual de respuesta a brechas con fases de detección, contención y cierre.",
    "Definir roles, responsables y vías de escalamiento ante incidentes.",
    "Fijar criterios y plazos para notificar a la APDP y a los afectados.",
    "Incorporar el registro y la evaluación posterior de cada incidente.",
  ],
  "DPC-INC-002": [
    "Implementar un registro histórico y centralizado de eventos e incidentes de seguridad.",
    "Difundir un protocolo de reporte conocido y accesible para el personal.",
    "Cubrir la doble notificación aplicable: APDP y ANCI/CSIRT.",
    "Ejecutar simulacros de brecha y conservar evidencia de los últimos 12 meses.",
  ],
  "DPC-EIA-001": [
    "Identificar los tratamientos de alto riesgo que requieren Evaluación de Impacto (EIPD).",
    "Ejecutar la EIPD antes de iniciar el tratamiento.",
    "Documentar en la EIPD los riesgos, el impacto y las medidas de mitigación.",
    "Revisar la EIPD periódicamente y ante cambios relevantes.",
  ],
  "DPC-EIA-002": [
    "Inventariar los procesos con decisiones automatizadas o perfilamiento.",
    "Establecer supervisión humana significativa sobre la decisión automatizada.",
    "Informar al titular sobre la lógica y las consecuencias del tratamiento automatizado.",
    "Habilitar un canal para revisar o impugnar la decisión automatizada.",
  ],
};

/** Prioridad por regla: "no" incumple del todo → alta; "partial"/"flagged" → media. */
function priorityForGap(gapType: GapType): Priority {
  return gapType === "no" ? "alta" : "media";
}

/** Plazo sugerido (semanas) por prioridad. */
function dueWeeksForPriority(priority: Priority): number {
  if (priority === "alta") return 2;
  if (priority === "media") return 4;
  return 8;
}

/**
 * Construye la propuesta de resolución de forma determinista a partir de los
 * gaps del diagnóstico. Sin llamadas de red. Un gap sin acción mapeada se omite
 * (el consultor puede agregarlo a mano en el Plan). El esfuerzo queda en "medio"
 * como default editable — no se asume el esfuerzo real de cada empresa.
 */
export function buildRemediationProposal(gaps: RemediationGap[]): ProposalItem[] {
  const out: ProposalItem[] = [];
  for (const gap of gaps) {
    const action = REMEDIATION_MAP[gap.controlCode]?.[gap.criterionIndex];
    if (!action) continue;
    const priority = priorityForGap(gap.gapType);
    out.push({
      controlCode: gap.controlCode,
      criterionIndex: gap.criterionIndex,
      gapType: gap.gapType,
      action,
      priority,
      effort: "medio",
      suggestedDueWeeks: dueWeeksForPriority(priority),
      rationale: `Cierra el criterio pendiente: "${gap.criterion}".`,
    });
  }
  return out;
}
