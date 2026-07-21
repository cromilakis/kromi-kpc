import { escapeHtml } from "../layout";
import { BLANK, type DocumentTemplate, type TemplateVars } from "./types";

/**
 * Formulario de Solicitud de Derechos del Titular (ARCOP) — formato para que
 * las personas ejerzan ante la empresa sus derechos de acceso, rectificación,
 * supresión, oposición, portabilidad y bloqueo (Arts. 4° a 11 de la
 * Ley 21.719), con sección de uso interno para controlar el plazo legal de
 * respuesta.
 *
 * ⚠️ BORRADOR PENDIENTE DE REVISIÓN LEGAL (gate pre-deploy).
 */
export const formularioArco: DocumentTemplate = {
  id: "formulario-arco",
  title: "Formulario de Solicitud de Derechos del Titular (ARCOP)",
  summary:
    "El formulario para que las personas ejerzan sus derechos ARCOP ante la empresa, con control interno del plazo legal de 30 días.",
  appliesTo: ["B-DER-001"],
  buildBodyHtml: (vars: TemplateVars) => {
    const name = escapeHtml(vars.companyName);
    const rut = escapeHtml(vars.companyRut);
    return `
<p><em>Versión 1.0 · Fecha de generación: ${escapeHtml(vars.generatedDate)} · Reemplaza a: no aplica (primera versión)</em></p>

<p>Solicitud de ejercicio de derechos de protección de datos personales conforme a la Ley
N° 19.628, reformada por la <strong>Ley N° 21.719</strong>, dirigida a
<strong>${name}</strong>, RUT ${rut}, con domicilio en ${BLANK}. Canal de recepción:
${BLANK} (correo electrónico y/o entrega presencial). El ejercicio de estos derechos es
<strong>gratuito</strong> (Art. 11).</p>

<h2>1. Identificación del titular</h2>
<table>
  <tr><th>Campo</th><th>Respuesta</th></tr>
  <tr><td>Nombre completo</td><td>${BLANK}</td></tr>
  <tr><td>RUN / cédula de identidad</td><td>${BLANK}</td></tr>
  <tr><td>Domicilio</td><td>${BLANK}</td></tr>
  <tr><td>Correo electrónico</td><td>${BLANK}</td></tr>
  <tr><td>Teléfono</td><td>${BLANK}</td></tr>
  <tr><td>Medio preferente de respuesta</td><td>☐ Correo electrónico &nbsp; ☐ Domicilio postal &nbsp; ☐ Retiro presencial</td></tr>
</table>
<p><strong>Si actúa un representante o mandatario:</strong> nombre ${BLANK}, RUN ${BLANK},
en calidad de ${BLANK}, quien adjunta el documento que acredita la representación (poder,
mandato o resolución que corresponda).</p>

<h2>2. Derecho que ejerce (marque uno o más)</h2>
<p>☐ <strong>ACCESO (Art. 5°).</strong> Solicito confirmar si ${name} trata mis datos
personales y, en caso afirmativo, acceder a ellos y conocer las categorías de datos, la
finalidad, los destinatarios, el plazo de conservación, el origen de los datos y la
existencia de decisiones automatizadas que me afecten.</p>
<p>☐ <strong>RECTIFICACIÓN (Art. 6°).</strong> Solicito rectificar los siguientes datos
inexactos, incompletos o desactualizados (indicar dato y valor correcto):
${BLANK}</p>
<p>☐ <strong>SUPRESIÓN (Art. 7°).</strong> Solicito la supresión de mis datos personales
por la(s) siguiente(s) razón(es): ☐ ya no son necesarios para la finalidad que justificó
su recolección; ☐ revoqué mi consentimiento y no existe otra base de licitud; ☐ el
tratamiento es ilícito; ☐ la supresión es exigida por ley; ☐ otra: ${BLANK}</p>
<p>☐ <strong>OPOSICIÓN (Art. 8°).</strong> Solicito que se deje de tratar mis datos para
la(s) siguiente(s) finalidad(es), por los motivos que expongo: ${BLANK}</p>
<p>☐ <strong>OPOSICIÓN A DECISIONES AUTOMATIZADAS (Art. 8° bis).</strong> Solicito no ser
objeto de decisiones basadas únicamente en tratamiento automatizado de mis datos, incluida
la elaboración de perfiles, que produzcan efectos jurídicos a mi respecto o me afecten
significativamente, y/o solicito la revisión humana de la siguiente decisión: ${BLANK}</p>
<p>☐ <strong>PORTABILIDAD (Art. 9°).</strong> Solicito recibir una copia de mis datos
personales en un formato estructurado, genérico y de uso común que permita su lectura
mecánica, y/o su transmisión directa a otro responsable. Formato preferido (CSV, JSON u
otro): ${BLANK}</p>
<p>☐ <strong>BLOQUEO (Art. 10).</strong> Solicito el bloqueo provisional de mis datos
mientras se resuelve mi solicitud de rectificación, supresión u oposición pendiente,
individualizada así: ${BLANK}</p>

<h2>3. Detalle de la solicitud</h2>
<p>Describa la información adicional que ayude a ubicar sus datos o a precisar la solicitud
(por ejemplo: relación con la empresa, fechas aproximadas, sucursal, número de cliente):</p>
<p>${BLANK}</p>
<p>${BLANK}</p>

<h2>4. Acreditación de identidad</h2>
<p>Adjunto copia de mi cédula de identidad vigente (o exhibo el original en la recepción
presencial). Si actúa un representante, adjunta además el documento que acredita la
representación. ${name} solo usará estos antecedentes para verificar la identidad del
solicitante y tramitar esta solicitud.</p>

<h2>5. Declaración y firma del titular</h2>
<p>Declaro que la información proporcionada es veraz y que ejerzo los derechos que me
confiere la Ley N° 19.628, reformada por la Ley N° 21.719.</p>
<table>
  <tr><th>Firma del titular (o representante)</th><th>Fecha</th></tr>
  <tr><td>${BLANK}</td><td>${BLANK}</td></tr>
</table>

<h2>6. Uso interno (no completar por el titular)</h2>
<table>
  <tr><th>Campo</th><th>Registro</th></tr>
  <tr><td>N° de solicitud</td><td>${BLANK}</td></tr>
  <tr><td>Fecha de recepción</td><td>${BLANK}</td></tr>
  <tr><td>Responsable de la tramitación</td><td>${BLANK}</td></tr>
  <tr><td>Plazo legal de respuesta (30 días corridos desde la recepción; prorrogable según la ley, informando al titular antes del vencimiento)</td><td>Vence el: ${BLANK}</td></tr>
  <tr><td>Resultado (acogida / parcialmente acogida / rechazada)</td><td>${BLANK}</td></tr>
  <tr><td>Fundamento del rechazo (si aplica, con la causal legal)</td><td>${BLANK}</td></tr>
  <tr><td>Fecha y medio de la respuesta</td><td>${BLANK}</td></tr>
</table>
<p><em>Recordatorios para el equipo:</em> la tramitación es gratuita para el titular; la
respuesta debe ser por escrito y fundada; y si la solicitud se rechaza o no se responde
dentro de plazo, el titular tiene derecho a reclamar ante la <strong>Agencia de Protección
de Datos Personales</strong>. Conserve este formulario y la respuesta como evidencia de
cumplimiento.</p>

<p style="margin-top:28px"><em>Documento tipo generado por DPC — Data Protection Compliance
como base estándar; debe completarse en los espacios en blanco y revisarse frente a la
operación real de la empresa antes de su uso.</em></p>`;
  },
};
