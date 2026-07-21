import { escapeHtml } from "../layout";
import { BLANK, type DocumentTemplate, type TemplateVars } from "./types";

/**
 * Cláusulas de Transferencia Internacional de Datos — anexo contractual con
 * garantías para proveedores que almacenan o procesan datos personales fuera
 * de Chile (Arts. 27 y siguientes de la Ley 21.719; deber de informar del
 * Art. 14 ter letra h), más inventario anexo de servicios con datos en el
 * extranjero.
 *
 * ⚠️ BORRADOR PENDIENTE DE REVISIÓN LEGAL (gate pre-deploy).
 */
export const clausulasTransferenciaInternacional: DocumentTemplate = {
  id: "clausulas-transferencia-internacional",
  title: "Cláusulas de Transferencia Internacional de Datos",
  summary:
    "Garantías contractuales para anexar cuando un proveedor almacena o procesa los datos fuera de Chile, más el inventario de esos servicios.",
  appliesTo: ["B-TER-002"],
  buildBodyHtml: (vars: TemplateVars) => {
    const name = escapeHtml(vars.companyName);
    const rut = escapeHtml(vars.companyRut);
    return `
<p><em>Versión 1.0 · Fecha de generación: ${escapeHtml(vars.generatedDate)} · Anexo para incorporar a contratos con proveedores que almacenan o procesan datos personales fuera de Chile.</em></p>

<h2>1. Objeto</h2>
<p>Estas cláusulas establecen las garantías bajo las cuales se transfieren datos personales
desde Chile al extranjero, conforme a las reglas de transferencia internacional de la Ley
19.628, reformada por la Ley 21.719. Se anexan al contrato de servicios respectivo y
prevalecen sobre cualquier estipulación de ese contrato que las contradiga en materia de
protección de datos.</p>

<h2>2. Identificación de las partes</h2>
<table>
  <tr><th>Rol</th><th>Razón social</th><th>RUT / Identificación</th><th>Domicilio</th></tr>
  <tr><td><strong>Exportador</strong> (quien transfiere)</td><td>${name}</td><td>${rut}</td><td>${BLANK}</td></tr>
  <tr><td><strong>Importador</strong> (quien recibe en el extranjero)</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
</table>

<h2>3. Países de destino y tratamiento</h2>
<p>Los datos serán almacenados o procesados en: ${BLANK} (país o países, incluida la región
de los centros de datos si se conoce). Categorías de datos transferidos: ${BLANK}.
Categorías de titulares: ${BLANK}. Finalidad de la transferencia: ${BLANK}.</p>

<h2>4. Garantías del Importador</h2>
<p>El Importador garantiza y se obliga a:</p>
<p><strong>4.1 Nivel de protección equivalente.</strong> Otorgar a los datos personales
transferidos un nivel de protección al menos equivalente al que exige la ley chilena,
cumpliendo los principios de licitud, finalidad, proporcionalidad, calidad, seguridad y
confidencialidad, cualquiera sea la legislación del país de destino.</p>
<p><strong>4.2 Confidencialidad.</strong> Mantener la confidencialidad de los datos, limitar
el acceso al personal autorizado y sujeto a deber de secreto, y no comunicarlos a terceros
salvo lo previsto en estas cláusulas o por obligación legal, en cuyo caso avisará al
Exportador antes de la entrega si la ley se lo permite.</p>
<p><strong>4.3 Seguridad.</strong> Aplicar medidas técnicas y organizativas apropiadas al
riesgo para garantizar la confidencialidad, integridad y disponibilidad de los datos, y
comunicar al Exportador sin dilación indebida —y en un plazo máximo de 24 horas desde que
tome conocimiento— toda vulneración de seguridad que los afecte.</p>
<p><strong>4.4 Sub-transferencias restringidas.</strong> No transferir los datos a otro país
ni a otro receptor sin autorización previa y por escrito del Exportador, y solo bajo
garantías al menos equivalentes a las de este anexo, respondiendo ante el Exportador por el
cumplimiento del sub-receptor.</p>
<p><strong>4.5 Colaboración con los titulares y con la Agencia.</strong> Colaborar
oportunamente con el Exportador para atender las solicitudes de derechos de los titulares
(acceso, rectificación, supresión, oposición, portabilidad y bloqueo) y los requerimientos,
consultas o fiscalizaciones de la <strong>Agencia de Protección de Datos Personales</strong>,
incluida la entrega de la información necesaria para acreditar el cumplimiento de estas
garantías.</p>

<h2>5. Deber de informar la transferencia (Art. 14 ter letra h)</h2>
<p>El Exportador informará a los titulares, en su política de tratamiento de datos, la
intención de transferir sus datos al extranjero y el país o países de destino, conforme al
<strong>Art. 14 ter letra h</strong>. El Importador entregará y mantendrá actualizada la
información necesaria para cumplir este deber (países, subencargados relevantes, cambios de
ubicación de los datos).</p>

<h2>6. Término y supresión</h2>
<p>Terminado el contrato de servicios, o revocada la autorización de transferencia, el
Importador suprimirá o devolverá al Exportador, a elección de éste, todos los datos
personales y sus copias, salvo obligación legal de conservación, dejando constancia escrita.
Las obligaciones de confidencialidad subsisten después del término.</p>

<h2>7. Firmas</h2>
<table>
  <tr><th>Por el Exportador (${name})</th><th>Por el Importador</th></tr>
  <tr><td>Nombre: ${BLANK}</td><td>Nombre: ${BLANK}</td></tr>
  <tr><td>Cargo: ${BLANK}</td><td>Cargo: ${BLANK}</td></tr>
  <tr><td>Firma: ${BLANK}</td><td>Firma: ${BLANK}</td></tr>
</table>
<p>Fecha de firma: ${BLANK} · Lugar: ${BLANK}</p>

<h2>ANEXO — Inventario de servicios con datos en el extranjero</h2>
<p>Inventario de ${name} de los servicios que almacenan o procesan datos personales fuera de
Chile (mantener actualizado y coherente con la política de tratamiento de datos):</p>
<table>
  <tr><th>Servicio / Proveedor</th><th>País</th><th>Datos</th><th>Garantía (este anexo, cláusulas del proveedor, otra)</th></tr>
  <tr><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
  <tr><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
  <tr><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
</table>

<p style="margin-top:28px"><em>Documento tipo generado por DPC — Data Protection Compliance
como base estándar; debe completarse en los espacios en blanco y revisarse frente a la
operación real de las partes antes de su firma.</em></p>`;
  },
};
