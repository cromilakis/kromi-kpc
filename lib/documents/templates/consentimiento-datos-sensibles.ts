import { escapeHtml } from "../layout";
import { BLANK, type DocumentTemplate, type TemplateVars } from "./types";

/**
 * Consentimiento Expreso para el Tratamiento de Datos Sensibles — formato para
 * obtener y acreditar el consentimiento que exigen los Arts. 16 y siguientes
 * de la Ley 21.719 para tratar datos sensibles (salud, biometría y otros del
 * Art. 2° letra g), con sección de autorización del representante legal para
 * niños, niñas y adolescentes (Art. 16 quáter).
 *
 * ⚠️ BORRADOR PENDIENTE DE REVISIÓN LEGAL (gate pre-deploy).
 */
export const consentimientoDatosSensibles: DocumentTemplate = {
  id: "consentimiento-datos-sensibles",
  title: "Consentimiento Expreso para el Tratamiento de Datos Sensibles",
  summary:
    "El consentimiento expreso y por escrito que la ley exige para tratar datos sensibles, con sección especial para datos de menores de edad.",
  appliesTo: ["B-LEG-002", "B-SAL-001", "B-MEN-001"],
  buildBodyHtml: (vars: TemplateVars) => {
    const name = escapeHtml(vars.companyName);
    const rut = escapeHtml(vars.companyRut);
    return `
<p><em>Versión 1.0 · Fecha de generación: ${escapeHtml(vars.generatedDate)} · Reemplaza a: no aplica (primera versión)</em></p>

<h2>1. Responsable del tratamiento</h2>
<p><strong>${name}</strong>, RUT ${rut}, con domicilio en ${BLANK}, es responsable del
tratamiento de datos sensibles descrito en este documento. Canal de contacto para materias
de datos personales: ${BLANK}. Los datos sensibles gozan de protección reforzada: por regla
general solo pueden tratarse con el <strong>consentimiento expreso</strong> del titular,
otorgado de forma libre, informada y específica (Arts. 16 y siguientes de la Ley 21.719).</p>

<h2>2. Identificación del titular de los datos</h2>
<table>
  <tr><th>Campo</th><th>Respuesta</th></tr>
  <tr><td>Nombre completo</td><td>${BLANK}</td></tr>
  <tr><td>RUN / cédula de identidad</td><td>${BLANK}</td></tr>
  <tr><td>Fecha de nacimiento</td><td>${BLANK}</td></tr>
  <tr><td>Domicilio</td><td>${BLANK}</td></tr>
  <tr><td>Correo electrónico / teléfono</td><td>${BLANK}</td></tr>
</table>

<h2>3. Categorías de datos sensibles que se tratarán (marque las que apliquen)</h2>
<table>
  <tr><th>Categoría (Art. 2° letra g)</th><th>Se tratará</th><th>Detalle de los datos</th></tr>
  <tr><td>Datos relativos a la salud (diagnósticos, tratamientos, exámenes, licencias, fichas)</td><td>☐ Sí</td><td>${BLANK}</td></tr>
  <tr><td>Datos biométricos (huella dactilar, reconocimiento facial, voz)</td><td>☐ Sí</td><td>${BLANK}</td></tr>
  <tr><td>Otras categorías sensibles (indicar: origen étnico, afiliación sindical, convicciones, vida sexual, etc.)</td><td>☐ Sí</td><td>${BLANK}</td></tr>
</table>

<h2>4. Finalidad específica del tratamiento</h2>
<p>Los datos sensibles indicados se tratarán <strong>única y exclusivamente</strong> para
la siguiente finalidad, que se declara de forma específica (Art. 3° letra b):</p>
<p>${BLANK}</p>
<p>Cualquier finalidad distinta requerirá un nuevo consentimiento expreso u otra
habilitación legal. Destinatarios o encargados que accederán a los datos (Art. 15 bis):
${BLANK}.</p>

<h2>5. Medidas de protección reforzadas</h2>
<p>${name} aplicará a estos datos medidas de seguridad acordes a su sensibilidad: acceso
restringido únicamente al personal que los necesita para la finalidad declarada, deber de
confidencialidad de ese personal, almacenamiento separado o cifrado cuando corresponda, y
registro de los accesos. Ante una vulneración de seguridad que afecte datos sensibles, la
empresa notificará a la Agencia de Protección de Datos Personales y comunicará a los
titulares afectados en los términos del Art. 14 quinquies y sexies.</p>
<p><strong>Datos de salud.</strong> Si los datos provienen de atenciones de salud, su
tratamiento respeta además la confidencialidad de la ficha clínica y de la información de
salud establecida en la <strong>Ley 20.584</strong> (derechos y deberes de los pacientes):
el acceso queda limitado a quienes la ley autoriza y este consentimiento no amplía ese
círculo.</p>

<h2>6. Plazo de conservación</h2>
<p>Los datos sensibles se conservarán solo por el tiempo necesario para la finalidad
declarada o por el plazo que exija la ley, y luego se suprimirán o anonimizarán de forma
segura. Plazo o criterio de conservación para este tratamiento: ${BLANK}.</p>

<h2>7. Derechos del titular y revocación</h2>
<p>El titular conserva sus derechos de acceso, rectificación, supresión, oposición,
portabilidad y bloqueo (Arts. 4° a 11), que puede ejercer gratuitamente ante la empresa por
el canal de la sección 1, con respuesta dentro de 30 días corridos. Puede
<strong>revocar este consentimiento en cualquier momento</strong>, sin expresión de causa y
sin efecto retroactivo; revocado, la empresa cesará el tratamiento salvo que exista otra
habilitación legal (Arts. 16 y 16 bis). En caso de disconformidad, puede reclamar ante la
<strong>Agencia de Protección de Datos Personales</strong>.</p>

<h2>8. Datos de niños, niñas y adolescentes (completar solo si aplica)</h2>
<p>El tratamiento de datos personales de niños, niñas y adolescentes debe atender siempre
su <strong>interés superior</strong>. Tratándose de <strong>menores de 14 años</strong>, el
consentimiento debe otorgarlo quien ejerce su representación legal o su cuidado personal
(Art. 16 quáter); los adolescentes de 14 años o más pueden consentir por sí mismos el
tratamiento de sus datos que no sean sensibles, pero el tratamiento de sus
<strong>datos sensibles</strong> requiere igualmente la autorización aquí regulada.</p>
<table>
  <tr><th>Representante legal / cuidador que autoriza</th><th>Respuesta</th></tr>
  <tr><td>Nombre completo</td><td>${BLANK}</td></tr>
  <tr><td>RUN / cédula de identidad</td><td>${BLANK}</td></tr>
  <tr><td>Calidad en que actúa (padre, madre, tutor, cuidador)</td><td>${BLANK}</td></tr>
  <tr><td>Documento que acredita la representación</td><td>${BLANK}</td></tr>
</table>

<h2>9. Declaración y consentimiento expreso</h2>
<p>Declaro haber leído este documento, comprender qué datos sensibles se tratarán, con qué
finalidad, por cuánto tiempo y con qué resguardos, y <strong>otorgo mi consentimiento
expreso</strong> para el tratamiento descrito. Entiendo que puedo revocarlo en cualquier
momento y que negarme no puede condicionar servicios que no requieran estos datos.</p>

<h2>10. Firmas</h2>
<table>
  <tr><th>Titular de los datos</th><th>Representante legal / cuidador (si aplica)</th></tr>
  <tr><td>Nombre: ${BLANK}</td><td>Nombre: ${BLANK}</td></tr>
  <tr><td>RUN: ${BLANK}</td><td>RUN: ${BLANK}</td></tr>
  <tr><td>Firma: ${BLANK}</td><td>Firma: ${BLANK}</td></tr>
  <tr><td>Fecha: ${BLANK}</td><td>Fecha: ${BLANK}</td></tr>
</table>
<p>Registro interno (completa la empresa): fecha y medio de otorgamiento ${BLANK} ·
persona que lo registró ${BLANK} · fecha de revocación (si ocurre) ${BLANK}.</p>

<p style="margin-top:28px"><em>Documento tipo generado por DPC — Data Protection Compliance
como base estándar; debe completarse en los espacios en blanco y revisarse frente a la
operación real de la empresa antes de su uso.</em></p>`;
  },
};
