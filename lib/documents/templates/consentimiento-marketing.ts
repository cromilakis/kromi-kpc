import { escapeHtml } from "../layout";
import { BLANK, type DocumentTemplate, type TemplateVars } from "./types";

/**
 * Consentimiento para Comunicaciones Comerciales — formato para obtener y
 * registrar el consentimiento libre, informado y específico para enviar
 * marketing (Art. 12 de la Ley 21.719), separado de las comunicaciones
 * operativas (principio de finalidad, Art. 3° letra b) y con la vía de
 * revocación y el opt-out del Art. 28 B de la Ley 19.496.
 *
 * ⚠️ BORRADOR PENDIENTE DE REVISIÓN LEGAL (gate pre-deploy).
 */
export const consentimientoMarketing: DocumentTemplate = {
  id: "consentimiento-marketing",
  title: "Consentimiento para Comunicaciones Comerciales",
  summary:
    "El consentimiento específico y revocable para enviar marketing por los canales que el titular elija, con registro que la empresa pueda demostrar.",
  appliesTo: ["B-LEG-001", "B-LEG-003"],
  buildBodyHtml: (vars: TemplateVars) => {
    const name = escapeHtml(vars.companyName);
    const rut = escapeHtml(vars.companyRut);
    return `
<p><em>Versión 1.0 · Fecha de generación: ${escapeHtml(vars.generatedDate)} · Reemplaza a: no aplica (primera versión)</em></p>

<h2>1. Responsable del tratamiento</h2>
<p><strong>${name}</strong>, RUT ${rut}, con domicilio en ${BLANK}, es responsable del
tratamiento descrito en este documento. Canal de contacto para materias de datos
personales: ${BLANK}. La política de tratamiento de datos de la empresa está disponible
en: ${BLANK}.</p>

<h2>2. Identificación del titular</h2>
<table>
  <tr><th>Campo</th><th>Respuesta</th></tr>
  <tr><td>Nombre completo</td><td>${BLANK}</td></tr>
  <tr><td>RUN / cédula de identidad (opcional)</td><td>${BLANK}</td></tr>
  <tr><td>Correo electrónico</td><td>${BLANK}</td></tr>
  <tr><td>Teléfono</td><td>${BLANK}</td></tr>
</table>

<h2>3. Qué autoriza este consentimiento</h2>
<p>Autorizo a ${name} a tratar mis datos de contacto con la <strong>finalidad específica</strong>
de enviarme comunicaciones comerciales: ofertas, promociones, novedades de productos o
servicios e invitaciones a actividades de la empresa. Conforme al principio de finalidad
(Art. 3° letra b de la Ley 21.719), esta autorización es <strong>independiente y separada</strong>
de las comunicaciones operativas del servicio o compra (confirmaciones, boletas,
recordatorios, avisos de despacho o garantía), que la empresa puede enviar sin este
consentimiento por ser necesarias para la ejecución del contrato (Art. 4°). Negarse a
recibir marketing <strong>no condiciona</strong> la compra ni la prestación del servicio.</p>

<h2>4. Canales autorizados (marque solo los que acepta)</h2>
<table>
  <tr><th>Canal</th><th>Autorizo</th></tr>
  <tr><td>Correo electrónico</td><td>☐ Sí</td></tr>
  <tr><td>WhatsApp / SMS</td><td>☐ Sí</td></tr>
  <tr><td>Llamadas telefónicas</td><td>☐ Sí</td></tr>
</table>
<p>La empresa solo usará los canales marcados. Los canales no marcados quedan
<strong>excluidos</strong> de las comunicaciones comerciales.</p>

<h2>5. Condiciones del consentimiento</h2>
<p>Este consentimiento es <strong>libre, informado y específico</strong> (Art. 12 de la
Ley 21.719): sé qué datos se usarán (mis datos de contacto), para qué (las comunicaciones
comerciales descritas) y por quién (${name}). Los datos no serán cedidos a terceros para
sus propios fines de marketing sin un nuevo consentimiento. Se conservarán para esta
finalidad mientras el consentimiento esté vigente.</p>
<p><strong>Revocación.</strong> Puedo revocar este consentimiento <strong>en cualquier
momento</strong>, sin expresión de causa, sin costo y sin efecto retroactivo (Art. 12),
escribiendo al canal de contacto de la sección 1 o usando la opción de baja incluida en
cada comunicación. Además, conforme al <strong>Art. 28 B de la Ley 19.496</strong> (derechos
del consumidor), toda comunicación promocional por correo electrónico debe indicar un medio
expedito para solicitar la suspensión de los envíos, y solicitada la suspensión, el envío de
nuevas comunicaciones queda prohibido.</p>
<p><strong>Derechos.</strong> Conservo mis derechos de acceso, rectificación, supresión,
oposición, portabilidad y bloqueo (Arts. 4° a 11 de la Ley 21.719), que puedo ejercer
gratuitamente ante la empresa y, en caso de disconformidad, reclamar ante la Agencia de
Protección de Datos Personales.</p>

<h2>6. Registro del consentimiento (completa la empresa)</h2>
<table>
  <tr><th>Campo</th><th>Registro</th></tr>
  <tr><td>Fecha de otorgamiento</td><td>${BLANK}</td></tr>
  <tr><td>Canal / medio en que se otorgó (papel, web, punto de venta)</td><td>${BLANK}</td></tr>
  <tr><td>Persona o sistema que lo registró</td><td>${BLANK}</td></tr>
  <tr><td>Fecha de revocación (si ocurre)</td><td>${BLANK}</td></tr>
</table>
<p>La empresa debe conservar este registro mientras el consentimiento esté vigente y por el
tiempo necesario para acreditar su existencia: la carga de demostrar el consentimiento es
del responsable.</p>

<h2>7. Firma del titular</h2>
<table>
  <tr><th>Nombre</th><th>RUN</th><th>Firma</th><th>Fecha</th></tr>
  <tr><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
</table>

<h2>8. Guía para uso en formularios web</h2>
<p><em>Para el equipo (no forma parte del texto que firma el titular):</em> si este
consentimiento se recoge en un formulario web o de checkout, use una casilla de
verificación <strong>NO pre-marcada</strong> y separada de la aceptación de los términos de
la compra — una casilla pre-marcada o un consentimiento "empaquetado" con el contrato no
cumple el estándar de consentimiento libre y específico. Junto a la casilla, enlace la
política de tratamiento y registre fecha, hora e identificador del formulario como
evidencia del consentimiento otorgado.</p>

<p style="margin-top:28px"><em>Documento tipo generado por DPC — Data Protection Compliance
como base estándar; debe completarse en los espacios en blanco y revisarse frente a la
operación real de la empresa antes de su uso.</em></p>`;
  },
};
