import { escapeHtml } from "../layout";
import { BLANK, type DocumentTemplate, type TemplateVars } from "./types";

/**
 * Acta de Designación del Responsable de Protección de Datos — formaliza por
 * escrito quién asume dentro de la empresa el rol de protección de datos
 * personales (funciones, autonomía, recursos y aceptación del cargo), como
 * primera evidencia de gobernanza exigible bajo la Ley 21.719.
 *
 * ⚠️ BORRADOR PENDIENTE DE REVISIÓN LEGAL (gate pre-deploy).
 */
export const actaDesignacionResponsable: DocumentTemplate = {
  id: "acta-designacion-responsable",
  title: "Acta de Designación del Responsable de Protección de Datos",
  summary:
    "El acta que designa formalmente a la persona a cargo de la protección de datos en la empresa: funciones, autonomía, recursos y aceptación firmada.",
  appliesTo: ["B-GOB-002"],
  buildBodyHtml: (vars: TemplateVars) => {
    const name = escapeHtml(vars.companyName);
    const rut = escapeHtml(vars.companyRut);
    return `
<p><em>Versión 1.0 · Fecha de generación: ${escapeHtml(vars.generatedDate)} · Reemplaza a: no aplica (primera versión)</em></p>

<h2>1. Comparecencia</h2>
<p>En ${BLANK}, a ${BLANK}, comparece don/doña ${BLANK}, cédula de identidad
N° ${BLANK}, en su calidad de representante legal de <strong>${name}</strong>,
RUT ${rut}, con domicilio en ${BLANK} (en adelante, "la Empresa"), quien suscribe la
presente acta en ejercicio de sus facultades de administración.</p>

<h2>2. Antecedentes y objeto</h2>
<p>La Ley N° 19.628, reformada por la <strong>Ley N° 21.719</strong>, exige a quienes tratan
datos personales una gobernanza demostrable: el principio de responsabilidad obliga a la
Empresa no solo a cumplir, sino a poder acreditar el cumplimiento. La política de
tratamiento debe identificar al responsable y el canal de contacto para materias de datos
personales (Art. 14 ter), y la Empresa debe estar en condiciones de atender las solicitudes
de derechos de los titulares (Arts. 4° a 11), coordinar la respuesta ante vulneraciones de
seguridad (Art. 14 quinquies y sexies) y actuar como interlocutor ante la
<strong>Agencia de Protección de Datos Personales</strong>. Con ese objeto, la Empresa
designa formalmente a la persona que asumirá el rol interno de protección de datos.</p>

<h2>3. Designación</h2>
<p>Por el presente acto, la Empresa designa como <strong>Responsable de Protección de
Datos</strong> (responsable interno / encargado de prevención en materia de datos
personales) a:</p>
<table>
  <tr><th>Campo</th><th>Detalle</th></tr>
  <tr><td>Nombre completo</td><td>${BLANK}</td></tr>
  <tr><td>Cédula de identidad (RUN)</td><td>${BLANK}</td></tr>
  <tr><td>Cargo en la Empresa</td><td>${BLANK}</td></tr>
  <tr><td>Correo electrónico de contacto</td><td>${BLANK}</td></tr>
  <tr><td>Teléfono de contacto</td><td>${BLANK}</td></tr>
  <tr><td>Fecha de inicio de funciones</td><td>${BLANK}</td></tr>
</table>
<p>La designación rige desde la fecha de la firma y se mantiene mientras no sea revocada o
reemplazada por escrito. El canal indicado será el punto de contacto de la Empresa para
materias de protección de datos, y se publicará en la política de tratamiento.</p>

<h2>4. Funciones del rol</h2>
<p>Corresponderá a la persona designada, sin perjuicio de las demás tareas que la
administración le encomiende:</p>
<p><strong>a) Gobernanza documental.</strong> Mantener actualizada la política de
tratamiento de datos personales de la Empresa (Art. 14 ter) y el registro de actividades
de tratamiento (RAT), y custodiar la evidencia de cumplimiento (consentimientos, contratos
de encargo del Art. 15 bis, actas y capacitaciones).</p>
<p><strong>b) Derechos de los titulares.</strong> Recibir y canalizar las solicitudes de
acceso, rectificación, supresión, oposición, portabilidad y bloqueo (Arts. 4° a 11),
incluida la oposición a decisiones automatizadas (Art. 8° bis), velando por que se
respondan dentro del plazo legal de 30 días corridos y de forma gratuita.</p>
<p><strong>c) Incidentes.</strong> Coordinar la respuesta ante vulneraciones de seguridad:
contención, evaluación del riesgo, notificación a la Agencia de Protección de Datos
Personales y, cuando la ley lo exija, comunicación a los titulares afectados
(Art. 14 quinquies y sexies), dejando registro de lo actuado.</p>
<p><strong>d) Reporte a la administración.</strong> Informar periódicamente a la gerencia
o directorio sobre el estado de cumplimiento, los riesgos detectados y las medidas
pendientes, y proponer las actualizaciones de políticas y procedimientos que correspondan.</p>
<p><strong>e) Cultura y capacitación.</strong> Promover la capacitación del personal que
trata datos personales y servir de punto de consulta interno en la materia.</p>

<h2>5. Autonomía y recursos</h2>
<p>La Empresa garantiza a la persona designada la autonomía necesaria para el ejercicio del
rol: reportará directamente a ${BLANK} (gerencia general / directorio), no recibirá
instrucciones que la obliguen a contravenir la normativa de protección de datos y no podrá
ser sancionada por el desempeño de buena fe de estas funciones. La Empresa proveerá el
tiempo, acceso a la información y recursos razonables para cumplirlas, incluyendo acceso a
asesoría externa cuando la complejidad del caso lo requiera.</p>

<h2>6. Aceptación del designado</h2>
<p>La persona designada declara conocer las funciones descritas en esta acta, aceptar la
designación y comprometerse a desempeñarla con la diligencia y confidencialidad debidas,
guardando reserva de los datos personales a los que acceda con ocasión del cargo, deber que
subsiste aun después del término de sus funciones.</p>

<h2>7. Firmas</h2>
<table>
  <tr><th>Representante legal de la Empresa</th><th>Responsable de Protección de Datos designado</th></tr>
  <tr><td>Nombre: ${BLANK}</td><td>Nombre: ${BLANK}</td></tr>
  <tr><td>RUN: ${BLANK}</td><td>RUN: ${BLANK}</td></tr>
  <tr><td>Cargo: ${BLANK}</td><td>Cargo: ${BLANK}</td></tr>
  <tr><td>Firma: ${BLANK}</td><td>Firma: ${BLANK}</td></tr>
  <tr><td>Fecha: ${BLANK}</td><td>Fecha: ${BLANK}</td></tr>
</table>

<p style="margin-top:28px"><em>Documento tipo generado por DPC — Data Protection Compliance
como base estándar; debe completarse en los espacios en blanco y revisarse frente a la
operación real de la empresa antes de su firma.</em></p>`;
  },
};
