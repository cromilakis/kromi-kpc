import { escapeHtml } from "../layout";
import { BLANK, type DocumentTemplate, type TemplateVars } from "./types";

/**
 * Política de Tratamiento de Datos Personales — cubre el deber de información
 * del Art. 14 ter (12 literales a–l) de la Ley 21.719. Documento tipo para
 * publicar en el sitio web y/o mantener disponible en el local.
 *
 * ⚠️ BORRADOR PENDIENTE DE REVISIÓN LEGAL (gate pre-deploy).
 */
export const politicaPrivacidad: DocumentTemplate = {
  id: "politica-privacidad",
  title: "Política de Tratamiento de Datos Personales",
  summary:
    "La política pública que la ley exige: quién trata los datos, para qué, con qué base y cómo ejercer los derechos (Art. 14 ter).",
  appliesTo: ["B-GOB-001", "B-WEB-001"],
  buildBodyHtml: (vars: TemplateVars) => {
    const name = escapeHtml(vars.companyName);
    const rut = escapeHtml(vars.companyRut);
    return `
<p><em>Versión 1.0 · Fecha de publicación: ${escapeHtml(vars.generatedDate)} · Reemplaza a: no aplica (primera versión)</em></p>

<h2>1. Responsable del tratamiento</h2>
<p><strong>${name}</strong>, RUT ${rut}, con domicilio en ${BLANK}, es responsable del
tratamiento de los datos personales descritos en esta política. Canal de contacto para
materias de datos personales: ${BLANK} (correo y/o teléfono). Encargado de prevención /
responsable interno de protección de datos: ${BLANK}.</p>

<h2>2. Categorías de datos que tratamos y sus titulares</h2>
<p>Tratamos las siguientes categorías de datos personales, según el tipo de titular:</p>
<table>
  <tr><th>Titulares</th><th>Categorías de datos</th></tr>
  <tr><td>Clientes y usuarios</td><td>Identificación (nombre, RUT), contacto (teléfono, correo, dirección), historial de compras o atenciones, datos de facturación. ${BLANK}</td></tr>
  <tr><td>Trabajadores y postulantes</td><td>Identificación, contacto, antecedentes laborales y previsionales, remuneraciones. ${BLANK}</td></tr>
  <tr><td>Proveedores</td><td>Identificación y contacto de contrapartes, datos de facturación. ${BLANK}</td></tr>
</table>
<p>Si tratamos datos sensibles (salud, biometría, u otros del Art. 2° letra g), lo hacemos
únicamente en los casos y con las garantías que se indican en la sección 4.</p>

<h2>3. Finalidades y bases de licitud</h2>
<p>Cada tratamiento se realiza para finalidades determinadas, explícitas y lícitas, y se
apoya en una base de licitud del Art. 4°:</p>
<table>
  <tr><th>Finalidad</th><th>Base de licitud</th></tr>
  <tr><td>Prestación del servicio o venta contratada (incluida boleta/factura y garantía)</td><td>Ejecución de contrato / obligación legal</td></tr>
  <tr><td>Comunicaciones operativas (confirmaciones, recordatorios, avisos del servicio)</td><td>Ejecución de contrato</td></tr>
  <tr><td>Comunicaciones comerciales y promociones</td><td>Consentimiento (revocable en todo momento)</td></tr>
  <tr><td>Gestión laboral y previsional</td><td>Contrato de trabajo / obligación legal</td></tr>
  <tr><td>${BLANK}</td><td>${BLANK}</td></tr>
</table>

<h2>4. Datos sensibles</h2>
<p>Solo tratamos datos personales sensibles cuando contamos con el consentimiento expreso
del titular u otra habilitación legal (Art. 16 y siguientes), y con medidas de seguridad
reforzadas. Detalle de los tratamientos de datos sensibles de la empresa: ${BLANK}.</p>

<h2>5. Destinatarios y encargados</h2>
<p>Los datos pueden ser tratados por prestadores de servicios que actúan por cuenta de
${name} (por ejemplo: servicios contables, informáticos, de facturación o de mensajería),
bajo contrato de encargo que les exige confidencialidad y seguridad (Art. 15 bis). No
cedemos datos personales a terceros para sus propios fines sin el consentimiento del
titular u otra base legal. Encargados actuales: ${BLANK}.</p>

<h2>6. Transferencias internacionales</h2>
<p>Cuando los datos se almacenan o procesan fuera de Chile (por ejemplo, servicios de nube),
verificamos que exista un nivel adecuado de protección o garantías contractuales conforme a
la ley (Art. 14 ter letra h). Servicios con datos en el extranjero y país: ${BLANK}.</p>

<h2>7. Plazos de conservación</h2>
<p>Conservamos los datos solo por el tiempo necesario para la finalidad que justificó su
recolección o por el plazo que exige la ley (por ejemplo, normativa tributaria o laboral), y
luego los eliminamos o anonimizamos de forma segura. Plazos por categoría: ${BLANK}.</p>

<h2>8. Fuente de los datos</h2>
<p>Los datos se recolectan directamente del titular. Si alguna categoría proviene de otra
fuente, se indica aquí junto con su origen: ${BLANK}.</p>

<h2>9. Medidas de seguridad</h2>
<p>Aplicamos medidas técnicas y organizativas apropiadas al riesgo del tratamiento: control
de acceso restringido al personal autorizado, deber de confidencialidad del equipo,
respaldos y, cuando corresponde, cifrado. Ante una vulneración de seguridad con riesgo para
los titulares, notificaremos a la Agencia de Protección de Datos Personales y, en los casos
que exige la ley, a los propios afectados (Art. 14 sexies).</p>

<h2>10. Derechos de los titulares</h2>
<p>Toda persona puede ejercer ante ${name} sus derechos de <strong>acceso, rectificación,
supresión, oposición, portabilidad y bloqueo</strong> (Arts. 4° a 11), incluido el derecho a
no ser objeto de decisiones automatizadas en los términos del Art. 8° bis, y a revocar su
consentimiento en cualquier momento, sin efecto retroactivo. Las solicitudes se reciben en
el canal indicado en la sección 1 y se responden dentro de <strong>30 días corridos</strong>.
El ejercicio de estos derechos es gratuito. Si la respuesta no es satisfactoria, el titular
puede reclamar ante la <strong>Agencia de Protección de Datos Personales</strong>.</p>

<h2>11. Decisiones automatizadas</h2>
<p>${name} ${BLANK} (indicar: "no toma decisiones basadas únicamente en tratamiento
automatizado" o describir el sistema, su lógica general y la vía para solicitar revisión
humana).</p>

<h2>12. Vigencia y cambios</h2>
<p>Esta política rige desde su fecha de publicación. Los cambios se publicarán por este
mismo medio indicando nueva versión y fecha.</p>

<p style="margin-top:28px"><em>Documento tipo generado por DPC — Data Protection Compliance
como base estándar; debe completarse en los espacios en blanco y revisarse frente a la
operación real de la empresa antes de su publicación.</em></p>`;
  },
};
