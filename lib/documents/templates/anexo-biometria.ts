import { escapeHtml } from "../layout";
import { BLANK, type DocumentTemplate, type TemplateVars } from "./types";

/**
 * Anexo de Tratamiento de Datos Biométricos (Trabajadores) — anexo al contrato
 * de trabajo que informa y documenta el uso de biometría (huella, facial) para
 * asistencia o control de acceso: qué dato se trata y cómo se almacena, la
 * alternativa no biométrica garantizada (para que el consentimiento sea libre),
 * la eliminación al término de la relación laboral y el consentimiento expreso
 * del trabajador (Art. 16 ter Ley 19.628 reformada por la Ley 21.719; Art. 154
 * y 154 bis del Código del Trabajo; dictámenes DT sobre biometría).
 *
 * ⚠️ BORRADOR PENDIENTE DE REVISIÓN LEGAL (gate pre-deploy).
 */
export const anexoBiometria: DocumentTemplate = {
  id: "anexo-biometria",
  title: "Anexo de Tratamiento de Datos Biométricos (Trabajadores)",
  summary:
    "Anexo al contrato de trabajo para el uso de huella o reconocimiento facial: información completa, alternativa no biométrica y consentimiento expreso.",
  appliesTo: ["B-BIO-001"],
  buildBodyHtml: (vars: TemplateVars) => {
    const name = escapeHtml(vars.companyName);
    const rut = escapeHtml(vars.companyRut);
    return `
<p><em>Versión 1.0 · Fecha de generación: ${escapeHtml(vars.generatedDate)} · Reemplaza a: no aplica (primera versión)</em></p>

<h2>1. Partes</h2>
<p>En ${BLANK}, a ${BLANK}, entre <strong>${name}</strong>, RUT ${rut}, representada
por don/doña ${BLANK}, cédula de identidad N° ${BLANK} (en adelante, "el Empleador"),
y don/doña ${BLANK}, cédula de identidad N° ${BLANK} (en adelante, "el Trabajador"),
se suscribe el presente anexo al contrato de trabajo de fecha ${BLANK}.</p>

<h2>2. Antecedentes legales</h2>
<p>Los datos biométricos (huella dactilar, geometría facial, iris, voz) son
<strong>datos personales sensibles</strong> y su tratamiento está sujeto al régimen
reforzado del <strong>Art. 16 ter de la Ley 19.628, reformada por la Ley 21.719</strong>:
antes de tratarlos, el responsable debe informar al titular el sistema utilizado, la
finalidad, el plazo de conservación y las medidas de seguridad. El empleador debe
además guardar reserva de los datos del trabajador (Art. 154 bis del Código del
Trabajo), y la Dirección del Trabajo ha exigido que los sistemas biométricos de
control de asistencia se implementen con proporcionalidad, información previa y
resguardo de los datos (Dictamen 5232/097, entre otros). Este anexo cumple ese deber
de información y documenta el consentimiento del Trabajador.</p>

<h2>3. Sistema utilizado y finalidad</h2>
<table>
  <tr><th>Campo</th><th>Detalle</th></tr>
  <tr><td>Tecnología</td><td>☐ Huella dactilar &nbsp;&nbsp; ☐ Reconocimiento facial &nbsp;&nbsp; ☐ Otro: ${BLANK}</td></tr>
  <tr><td>Finalidad</td><td>☐ Registro de asistencia (Art. 154 CT) &nbsp;&nbsp; ☐ Control de acceso a instalaciones &nbsp;&nbsp; ☐ Otra: ${BLANK}</td></tr>
  <tr><td>Equipo / proveedor del sistema</td><td>${BLANK}</td></tr>
  <tr><td>Lugar de instalación</td><td>${BLANK}</td></tr>
</table>
<p>El dato biométrico se usará <strong>exclusivamente</strong> para la finalidad
marcada. Queda prohibido cualquier uso distinto (evaluación de desempeño,
geolocalización, perfilamiento) sin un nuevo consentimiento expreso.</p>

<h2>4. Qué dato se trata y cómo se almacena</h2>
<p>El sistema <strong>no almacena la imagen bruta</strong> de la huella o del rostro,
sino una <strong>plantilla matemática (hash) irreversible</strong>, generada al
momento del enrolamiento, que no permite reconstruir la huella ni la fotografía del
Trabajador. La plantilla se almacena en ${BLANK} (equipo local / servidor / nube,
indicar), cifrada y con acceso restringido a: ${BLANK} (cargos autorizados). El
Empleador no cede este dato a terceros, salvo el proveedor del sistema en calidad de
encargado bajo contrato (Art. 15 bis) o requerimiento de autoridad competente.</p>

<h2>5. Alternativa no biométrica garantizada</h2>
<p>Para que el consentimiento sea <strong>libre</strong> —condición de validez cuando
existe subordinación laboral— el Empleador garantiza al Trabajador una
<strong>alternativa no biométrica equivalente</strong> para la misma finalidad:
☐ tarjeta de proximidad &nbsp; ☐ clave/PIN personal &nbsp; ☐ libro de asistencia
&nbsp; ☐ otra: ${BLANK}. Elegir la alternativa <strong>no acarrea consecuencia
negativa alguna</strong> (ni salarial, ni de trato, ni de evaluación), y el
Trabajador puede cambiar de modalidad en cualquier momento avisando por escrito a
${BLANK}, con efecto dentro de los ${BLANK} días siguientes.</p>

<h2>6. Conservación y eliminación</h2>
<p>La plantilla biométrica se conserva solo mientras dure la relación laboral y la
finalidad indicada. Al <strong>término de la relación laboral</strong> —o si el
Trabajador revoca su consentimiento y opta por la alternativa— la plantilla se
elimina de forma definitiva del equipo, del servidor y de los respaldos dentro del
plazo de ${BLANK} días, dejando constancia escrita de la eliminación. Los registros
de asistencia (fecha y hora de marcaje, sin el dato biométrico) se conservan por los
plazos laborales que exige la ley.</p>

<h2>7. Derechos del Trabajador</h2>
<p>El Trabajador puede ejercer en todo momento sus derechos de acceso, rectificación,
supresión, oposición, portabilidad y bloqueo (Arts. 4° a 11 de la Ley 19.628
reformada), y <strong>revocar este consentimiento sin expresión de causa y sin efecto
retroactivo</strong>, pasando a la alternativa de la sección 5. Canal para ejercer
estos derechos: ${BLANK}. Plazo de respuesta: 30 días corridos, gratuito. Si la
respuesta no es satisfactoria, puede reclamar ante la Agencia de Protección de Datos
Personales, sin perjuicio de las competencias de la Dirección del Trabajo.</p>

<h2>8. Consentimiento expreso</h2>
<p>El Trabajador declara haber leído este anexo, haber recibido la información de las
secciones 3 a 6, conocer la alternativa no biométrica y <strong>consentir de manera
libre, informada, específica e inequívoca</strong> el tratamiento de su dato
biométrico para la finalidad indicada. Este anexo forma parte integrante del contrato
de trabajo y se firma en dos ejemplares, quedando uno en poder de cada parte.</p>

<h2>9. Firmas</h2>
<table>
  <tr><th>Empleador (o representante)</th><th>Trabajador</th></tr>
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
