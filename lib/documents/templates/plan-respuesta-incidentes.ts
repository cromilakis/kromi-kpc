import { escapeHtml } from "../layout";
import { BLANK, type DocumentTemplate, type TemplateVars } from "./types";

/**
 * Plan de Respuesta ante Incidentes de Datos Personales — procedimiento
 * interno para detectar, contener y notificar vulneraciones de seguridad
 * conforme al Art. 14 sexies de la Ley 21.719, con coordinación con la Ley
 * 21.663 (Marco de Ciberseguridad / ANCI) cuando aplique, y registro anexo
 * de incidentes.
 *
 * ⚠️ BORRADOR PENDIENTE DE REVISIÓN LEGAL (gate pre-deploy).
 */
export const planRespuestaIncidentes: DocumentTemplate = {
  id: "plan-respuesta-incidentes",
  title: "Plan de Respuesta ante Incidentes de Datos Personales",
  summary:
    "Qué hacer, quién y en qué plazos cuando se vulnera la seguridad de los datos, incluida la notificación a la Agencia y a los titulares (Art. 14 sexies).",
  appliesTo: ["B-SEG-003", "B-INC-001"],
  buildBodyHtml: (vars: TemplateVars) => {
    const name = escapeHtml(vars.companyName);
    const rut = escapeHtml(vars.companyRut);
    return `
<p><em>Versión 1.0 · Fecha de aprobación: ${escapeHtml(vars.generatedDate)} · Reemplaza a: no aplica (primera versión)</em></p>

<h2>1. Objeto y alcance</h2>
<p>Este plan define cómo <strong>${name}</strong>, RUT ${rut}, detecta, contiene, evalúa y
notifica las vulneraciones a la seguridad de los datos personales que trata, en cumplimiento
del <strong>Art. 14 sexies</strong> de la Ley 19.628, reformada por la Ley 21.719. Obliga a
todo el personal: cualquier persona que detecte o sospeche un incidente debe reportarlo de
inmediato conforme a la fase 1, sin evaluar por su cuenta si "es grave o no".</p>

<h2>2. Qué es un incidente de datos personales</h2>
<p>Es toda vulneración de las medidas de seguridad que provoque la <strong>destrucción,
filtración, pérdida o alteración</strong> de datos personales, o el <strong>acceso o
comunicación no autorizados</strong> a ellos, sea accidental o ilícita. Ejemplos: correo con
datos enviado al destinatario equivocado, robo o extravío de un notebook o teléfono,
ransomware o acceso indebido a un sistema, pérdida de carpetas físicas, ex trabajador que
conserva accesos, publicación involuntaria de una planilla.</p>

<h2>3. Roles y contactos</h2>
<table>
  <tr><th>Rol</th><th>Nombre y cargo</th><th>Contacto</th></tr>
  <tr><td>Responsable del plan (coordina la respuesta)</td><td>${BLANK}</td><td>${BLANK}</td></tr>
  <tr><td>Soporte técnico / informático (interno o externo)</td><td>${BLANK}</td><td>${BLANK}</td></tr>
  <tr><td>Vocería y notificaciones (Agencia, titulares)</td><td>${BLANK}</td><td>${BLANK}</td></tr>
  <tr><td>Asesoría legal</td><td>${BLANK}</td><td>${BLANK}</td></tr>
</table>

<h2>4. Fase 1 — Detección y reporte interno inmediato</h2>
<p>Quien detecte o sospeche un incidente lo reporta <strong>de inmediato</strong> —el mismo
día y por el medio más rápido disponible— al responsable del plan, indicando qué ocurrió,
cuándo se detectó, qué sistemas o documentos están involucrados y qué se sabe hasta el
momento. El responsable abre una entrada en el Registro de Incidentes (anexo) y coordina las
fases siguientes. Reportar nunca es sancionable; ocultar un incidente, sí.</p>

<h2>5. Fase 2 — Contención</h2>
<p>Se adoptan sin demora las medidas para detener o acotar el daño: cambiar contraseñas y
revocar accesos comprometidos, aislar o apagar el equipo afectado, bloquear cuentas, recuperar
o solicitar la eliminación del correo o archivo enviado por error, activar el bloqueo remoto
del dispositivo perdido. Se <strong>preserva la evidencia</strong> (registros, correos,
capturas) para la evaluación posterior y una eventual denuncia.</p>

<h2>6. Fase 3 — Evaluación del riesgo para los titulares</h2>
<p>El responsable del plan evalúa y deja constancia de: qué datos se vieron afectados y de
cuántos titulares; si incluyen <strong>datos sensibles</strong> (Art. 2° letra g), datos de
<strong>niños, niñas y adolescentes menores de 14 años</strong> o datos relativos a
<strong>obligaciones económicas, financieras, bancarias o comerciales</strong>; qué
consecuencias puede sufrir el titular (fraude, suplantación, discriminación, exposición); y
si los datos estaban cifrados o de otro modo ininteligibles para terceros. Esta evaluación
determina las notificaciones de la fase 4.</p>

<h2>7. Fase 4 — Notificación a la Agencia, a los titulares y coordinación con ANCI</h2>
<p><strong>A la Agencia de Protección de Datos Personales:</strong> cuando la vulneración
genere un riesgo razonable para los derechos de los titulares, se notifica <strong>"por los
medios más expeditos posibles y sin dilaciones indebidas"</strong> (Art. 14 sexies),
informando la naturaleza de la vulneración, los datos y titulares afectados, las medidas
adoptadas y un punto de contacto.</p>
<p><strong>A los titulares:</strong> además se notifica directamente a los afectados, en
lenguaje claro y sencillo, cuando la vulneración afecte <strong>datos sensibles, datos de
menores de 14 años o datos relativos a obligaciones económicas, financieras, bancarias o
comerciales</strong>, indicando qué ocurrió, qué medidas se tomaron y qué precauciones puede
adoptar el titular (cambio de claves, alerta ante fraudes).</p>
<p><strong>Coordinación con ANCI/CSIRT:</strong> si el incidente es también un incidente de
ciberseguridad y la empresa está sujeta a la <strong>Ley 21.663</strong> (Ley Marco de
Ciberseguridad) como servicio esencial u operador de importancia vital, se cumplen además los
reportes al CSIRT Nacional en los plazos de esa ley. Si hay delito informático (Ley 21.459),
se evalúa con la asesoría legal la denuncia correspondiente.</p>

<h2>8. Fase 5 — Recuperación</h2>
<p>Se restablece la operación normal: restauración desde respaldos verificados, reinstalación
o reemplazo de sistemas comprometidos, regeneración de credenciales, verificación de la
integridad de los datos recuperados y confirmación de que la causa del incidente fue
eliminada antes de reconectar los sistemas.</p>

<h2>9. Fase 6 — Lecciones aprendidas</h2>
<p>Cerrado el incidente, y a más tardar dentro de ${BLANK} días, el responsable del plan
documenta la causa raíz, evalúa qué medidas habrían evitado o reducido el daño y define
acciones correctivas con responsable y plazo (parches, capacitación, cambios de
procedimiento). El Registro de Incidentes se conserva y queda disponible para la Agencia como
evidencia del cumplimiento.</p>

<h2>ANEXO — Registro de Incidentes</h2>
<p>Cada incidente, notificable o no, se anota en este registro:</p>
<table>
  <tr><th>Fecha</th><th>Descripción</th><th>Datos afectados</th><th>Titulares afectados</th><th>Riesgo</th><th>Medidas adoptadas</th><th>¿Notificado a Agencia / titulares?</th><th>Cierre</th></tr>
  <tr><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
  <tr><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
  <tr><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
</table>

<p style="margin-top:28px"><em>Documento tipo generado por DPC — Data Protection Compliance
como base estándar; debe completarse en los espacios en blanco y revisarse frente a la
operación real de la empresa antes de su aprobación.</em></p>`;
  },
};
