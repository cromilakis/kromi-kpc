import { escapeHtml } from "../layout";
import { BLANK, type DocumentTemplate, type TemplateVars } from "./types";

/**
 * Acta de Capacitación y Compromiso de Confidencialidad — la "toma de
 * conocimiento" que los trabajadores firman: deja constancia de la
 * capacitación en protección de datos (contenidos mínimos), formaliza el
 * compromiso individual de secreto y buen uso de los datos personales
 * (principio de confidencialidad de la Ley 19.628 reformada por la Ley 21.719
 * y Art. 154 bis del Código del Trabajo), e incluye la nómina de firmas para
 * el equipo completo.
 *
 * ⚠️ BORRADOR PENDIENTE DE REVISIÓN LEGAL (gate pre-deploy).
 */
export const actaConfidencialidadCapacitacion: DocumentTemplate = {
  id: "acta-confidencialidad-capacitacion",
  title: "Acta de Capacitación y Compromiso de Confidencialidad",
  summary:
    "Constancia de la capacitación en protección de datos y compromiso de confidencialidad individual, con nómina de firmas para todo el equipo.",
  appliesTo: ["B-CAP-001"],
  buildBodyHtml: (vars: TemplateVars) => {
    const name = escapeHtml(vars.companyName);
    const rut = escapeHtml(vars.companyRut);
    return `
<p><em>Versión 1.0 · Fecha de generación: ${escapeHtml(vars.generatedDate)} · Reemplaza a: no aplica (primera versión)</em></p>

<h2>Parte A — Constancia de capacitación</h2>
<p>Se deja constancia de que <strong>${name}</strong>, RUT ${rut} (en adelante, "la
Empresa"), realizó una capacitación en protección de datos personales conforme a la
Ley 19.628, reformada por la <strong>Ley 21.719</strong>, dirigida al personal que
trata datos personales en sus funciones:</p>
<table>
  <tr><th>Campo</th><th>Detalle</th></tr>
  <tr><td>Fecha de la capacitación</td><td>${BLANK}</td></tr>
  <tr><td>Modalidad y duración</td><td>${BLANK}</td></tr>
  <tr><td>Relator (nombre y cargo/entidad)</td><td>${BLANK}</td></tr>
  <tr><td>Áreas o equipos convocados</td><td>${BLANK}</td></tr>
</table>
<p>La capacitación cubrió, como mínimo, los siguientes contenidos:</p>
<p><strong>a)</strong> qué es un dato personal y qué es un dato sensible (salud,
biometría, afiliación sindical, entre otros del Art. 2° letra g), y por qué los
sensibles exigen resguardo reforzado;<br />
<strong>b)</strong> los principios de la ley: licitud, finalidad, proporcionalidad,
calidad, seguridad, transparencia, confidencialidad y responsabilidad (Art. 3°);<br />
<strong>c)</strong> las reglas internas de seguridad de la Empresa: control de acceso,
uso de credenciales personales, escritorio limpio, prohibición de sacar datos de los
sistemas autorizados;<br />
<strong>d)</strong> cómo reconocer y derivar una solicitud de derechos de un titular
—acceso, rectificación, supresión, oposición, portabilidad, bloqueo (Arts. 4° a
11)— al canal interno, sin dejarla pasar (el plazo legal de respuesta es de 30 días
corridos);<br />
<strong>e)</strong> qué hacer ante un incidente o sospecha de vulneración de
seguridad: reportar de inmediato al responsable interno, no ocultar ni intentar
resolver por cuenta propia (la Empresa puede tener que notificar a la Agencia de
Protección de Datos Personales, Art. 14 quinquies y sexies).</p>

<h2>Parte B — Compromiso individual de confidencialidad</h2>
<p>Cada trabajador que firma la nómina de la Parte C declara haber asistido a la
capacitación (o recibido sus contenidos) y asume, individualmente, los siguientes
compromisos, que complementan su contrato de trabajo y el deber de reserva que la ley
impone a quienes tratan datos personales (principio de confidencialidad, Art. 3°;
Art. 154 bis del Código del Trabajo):</p>
<p><strong>1. Deber de secreto.</strong> Guardar reserva de todos los datos personales
de clientes, trabajadores, postulantes, proveedores u otras personas a los que acceda
con ocasión de sus funciones. Este deber <strong>subsiste después del término de la
relación laboral</strong>, indefinidamente.</p>
<p><strong>2. Uso limitado.</strong> Usar los datos personales única y exclusivamente
para las funciones asignadas por la Empresa. Consultar datos por curiosidad, para
fines personales o para terceros constituye un uso prohibido, aunque se tenga acceso
técnico a ellos.</p>
<p><strong>3. No extracción.</strong> No copiar, fotografiar, descargar ni enviar
datos personales a correos, teléfonos, pendrives, nubes o cuentas personales, ni
compartirlos por grupos de mensajería no autorizados por la Empresa.</p>
<p><strong>4. Reporte inmediato de incidentes.</strong> Informar de inmediato a
${BLANK} (responsable interno / canal de reporte) cualquier incidente, pérdida,
acceso indebido o sospecha de vulneración que afecte datos personales, sin ocultarlo
ni demorarlo.</p>
<p><strong>5. Consecuencias.</strong> El incumplimiento de estos compromisos puede
configurar infracción grave a las obligaciones del contrato de trabajo y al Reglamento
Interno, sin perjuicio de la responsabilidad civil o penal que corresponda (por
ejemplo, la del Art. 161-A del Código Penal por difusión de registros privados) y de
las sanciones que la Ley 21.719 contempla para la Empresa, que ésta podrá repetir
contra el responsable cuando la ley lo permita.</p>

<h2>Parte C — Nómina de firmas</h2>
<p>Firman a continuación los trabajadores capacitados, en señal de haber recibido la
capacitación de la Parte A y de asumir los compromisos de la Parte B:</p>
<table>
  <tr><th>Nombre completo</th><th>RUT</th><th>Cargo</th><th>Firma</th><th>Fecha</th></tr>
  <tr><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
  <tr><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
  <tr><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
  <tr><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
  <tr><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
  <tr><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
  <tr><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
  <tr><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
</table>
<p>(Agregar hojas adicionales de nómina si el equipo excede las filas disponibles.)</p>

<h2>Cierre</h2>
<table>
  <tr><th>Responsable de la capacitación / de protección de datos</th><th>Representante de la Empresa</th></tr>
  <tr><td>Nombre: ${BLANK}</td><td>Nombre: ${BLANK}</td></tr>
  <tr><td>RUN: ${BLANK}</td><td>RUN: ${BLANK}</td></tr>
  <tr><td>Firma: ${BLANK}</td><td>Firma: ${BLANK}</td></tr>
  <tr><td>Fecha: ${BLANK}</td><td>Fecha: ${BLANK}</td></tr>
</table>

<p style="margin-top:28px"><em>Documento tipo generado por DPC — Data Protection Compliance
como base estándar; debe completarse en los espacios en blanco y revisarse frente a la
operación real de la empresa antes de su firma.</em></p>`;
  },
};
