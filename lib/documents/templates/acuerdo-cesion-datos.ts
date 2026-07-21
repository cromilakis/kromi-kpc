import { escapeHtml } from "../layout";
import { BLANK, type DocumentTemplate, type TemplateVars } from "./types";

/**
 * Acuerdo de Cesión de Datos Personales entre Empresas — contrato escrito que
 * el Art. 15 de la Ley 21.719 exige para comunicar o ceder datos a otra
 * empresa que los tratará para sus propios fines (grupo empresarial,
 * franquicias, partners comerciales), sobre la base del consentimiento de los
 * titulares u otra base de licitud.
 *
 * ⚠️ BORRADOR PENDIENTE DE REVISIÓN LEGAL (gate pre-deploy).
 */
export const acuerdoCesionDatos: DocumentTemplate = {
  id: "acuerdo-cesion-datos",
  title: "Acuerdo de Cesión de Datos Personales entre Empresas",
  summary:
    "El contrato escrito que la ley exige para compartir datos con empresas del grupo, franquicias o partners que los usarán para sus propios fines (Art. 15).",
  appliesTo: ["B-CES-001"],
  buildBodyHtml: (vars: TemplateVars) => {
    const name = escapeHtml(vars.companyName);
    const rut = escapeHtml(vars.companyRut);
    return `
<p><em>Versión 1.0 · Fecha de generación: ${escapeHtml(vars.generatedDate)} · Contrato escrito exigido para la cesión de datos personales entre empresas (Art. 15).</em></p>

<h2>1. Partes</h2>
<table>
  <tr><th>Rol</th><th>Razón social</th><th>RUT</th><th>Domicilio</th></tr>
  <tr><td><strong>Cedente</strong> (quien comunica los datos)</td><td>${name}</td><td>${rut}</td><td>${BLANK}</td></tr>
  <tr><td><strong>Cesionario</strong> (quien los recibe para sus propios fines)</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
</table>
<p>Relación entre las partes (empresa del mismo grupo, franquicia, partner comercial, otra):
${BLANK}.</p>

<h2>2. Objeto</h2>
<p>El Cedente comunica al Cesionario los datos personales descritos en la sección 3 para que
éste los trate <strong>como responsable, para su propia finalidad</strong>, conforme al
<strong>Art. 15</strong> de la Ley 19.628, reformada por la Ley 21.719, que exige que la
cesión conste en un contrato escrito y se ampare en una base de licitud. Esta cesión es
distinta de un encargo de tratamiento (Art. 15 bis): el Cesionario no actúa por cuenta del
Cedente, sino que asume sus propias obligaciones legales sobre los datos recibidos.</p>

<h2>3. Datos cedidos y finalidad específica</h2>
<table>
  <tr><th>Elemento</th><th>Descripción</th></tr>
  <tr><td>Categorías de datos cedidos</td><td>${BLANK} (p. ej. identificación, contacto, historial de compras)</td></tr>
  <tr><td>Categorías de titulares</td><td>${BLANK} (p. ej. clientes, socios del programa de fidelización)</td></tr>
  <tr><td>Finalidad específica del Cesionario</td><td>${BLANK} (determinada, explícita y lícita; el Cesionario no puede usar los datos para otra cosa)</td></tr>
  <tr><td>Forma y periodicidad de la entrega</td><td>${BLANK}</td></tr>
</table>
<p>No se ceden datos personales sensibles (Art. 2° letra g) bajo este acuerdo, salvo que se
indique expresamente aquí junto con su habilitación legal reforzada: ${BLANK}.</p>

<h2>4. Base de licitud de la cesión</h2>
<p>El Cedente declara y acredita que cuenta con el <strong>consentimiento</strong> de los
titulares para esta cesión —otorgado en forma libre, informada, específica e inequívoca,
informando la cesión, el Cesionario y su finalidad— u otra base de licitud del Art. 4°, que
se identifica en: ${BLANK}. El Cedente conserva el respaldo (formularios, registros de
aceptación) y lo exhibirá al Cesionario o a la Agencia de Protección de Datos Personales a
requerimiento.</p>
<p><em>Texto sugerido para recabar el consentimiento del titular:</em> "Autorizo a ${name} a
comunicar mis datos de ${BLANK} (categorías) a ${BLANK} (nombre del cesionario), para que
ésta los utilice con la finalidad de ${BLANK}. Puedo revocar esta autorización en cualquier
momento, sin efecto retroactivo, en ${BLANK} (canal)."</p>

<h2>5. Obligaciones del Cesionario</h2>
<p>El Cesionario se obliga a:</p>
<p><strong>5.1 Finalidad pactada.</strong> Tratar los datos exclusivamente para la finalidad
específica de la sección 3, sin usarlos para fines distintos ni cruzarlos con otras fuentes
para propósitos no informados a los titulares.</p>
<p><strong>5.2 Seguridad.</strong> Aplicar medidas técnicas y organizativas apropiadas al
riesgo (Art. 14 quinquies) y comunicar al Cedente, sin dilación indebida, toda vulneración de
seguridad que afecte los datos cedidos, sin perjuicio de sus propios deberes de notificación
del Art. 14 sexies.</p>
<p><strong>5.3 Derechos de los titulares.</strong> Atender directamente, como responsable,
las solicitudes de acceso, rectificación, supresión, oposición, portabilidad y bloqueo de los
titulares (Arts. 4° a 11), incluida la revocación del consentimiento, e informar al Cedente
de las revocaciones que afecten futuras entregas.</p>
<p><strong>5.4 Prohibición de re-cesión.</strong> No ceder ni comunicar los datos a terceros,
a título gratuito u oneroso, sin el consentimiento previo de los titulares que cubra esa
nueva cesión y la autorización escrita del Cedente.</p>

<h2>6. Responsabilidad de cada parte</h2>
<p>Cada parte responde por sus propios tratamientos: el Cedente, por la licitud de la cesión
y de la base que la sustenta; el Cesionario, por el tratamiento que realice de los datos
recibidos, incluido su deber de información a los titulares. La parte que por su
incumplimiento cause daño a los titulares, a la otra parte o a terceros, o que exponga a la
otra parte a sanciones de la Agencia de Protección de Datos Personales, deberá indemnizarlo
conforme a las reglas generales.</p>

<h2>7. Vigencia y término</h2>
<p>Este acuerdo rige desde su firma y por ${BLANK}. A su término, o si se revoca la base de
licitud, cesan las entregas y el Cesionario suprime los datos cedidos cuya conservación no
esté justificada en una finalidad u obligación legal propia, dejando constancia escrita al
Cedente.</p>

<h2>8. Firmas</h2>
<table>
  <tr><th>Por el Cedente (${name})</th><th>Por el Cesionario</th></tr>
  <tr><td>Nombre: ${BLANK}</td><td>Nombre: ${BLANK}</td></tr>
  <tr><td>RUT: ${BLANK}</td><td>RUT: ${BLANK}</td></tr>
  <tr><td>Cargo: ${BLANK}</td><td>Cargo: ${BLANK}</td></tr>
  <tr><td>Firma: ${BLANK}</td><td>Firma: ${BLANK}</td></tr>
</table>
<p>Fecha de firma: ${BLANK} · Lugar: ${BLANK}</p>

<p style="margin-top:28px"><em>Documento tipo generado por DPC — Data Protection Compliance
como base estándar; debe completarse en los espacios en blanco y revisarse frente a la
operación real de las partes antes de su firma.</em></p>`;
  },
};
