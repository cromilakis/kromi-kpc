import { escapeHtml } from "../layout";
import { BLANK, type DocumentTemplate, type TemplateVars } from "./types";

/**
 * Política de Datos Personales de Trabajadores y Postulantes — ordena el
 * tratamiento de datos en el ciclo laboral completo: reserva de los datos del
 * trabajador (Art. 154 bis del Código del Trabajo), reglas de selección sin
 * datos discriminatorios (Art. 2 CT), eliminación de antecedentes de
 * postulantes no seleccionados, límites al monitoreo de correo/equipos
 * (dictámenes DT) y resguardo de datos sindicales, bajo el estándar de la
 * Ley 19.628 reformada por la Ley 21.719.
 *
 * ⚠️ BORRADOR PENDIENTE DE REVISIÓN LEGAL (gate pre-deploy).
 */
export const politicaDatosLaborales: DocumentTemplate = {
  id: "politica-datos-laborales",
  title: "Política de Datos Personales de Trabajadores y Postulantes",
  summary:
    "Las reglas internas para tratar datos de trabajadores y postulantes: reserva, selección sin datos discriminatorios, límites al monitoreo y canal de consultas.",
  appliesTo: ["B-LAB-001", "B-LAB-002"],
  buildBodyHtml: (vars: TemplateVars) => {
    const name = escapeHtml(vars.companyName);
    const rut = escapeHtml(vars.companyRut);
    return `
<p><em>Versión 1.0 · Fecha de publicación: ${escapeHtml(vars.generatedDate)} · Reemplaza a: no aplica (primera versión)</em></p>

<h2>1. Objeto y alcance</h2>
<p>Esta política regula cómo <strong>${name}</strong>, RUT ${rut} (en adelante, "la
Empresa"), trata los datos personales de sus trabajadores, ex trabajadores y
postulantes a empleo, en cumplimiento de la Ley 19.628 reformada por la
<strong>Ley 21.719</strong> y del Código del Trabajo. Obliga a toda persona que, por
sus funciones, acceda a estos datos (jefaturas, remuneraciones, recursos humanos,
informática) y complementa el Reglamento Interno de Orden, Higiene y Seguridad.</p>

<h2>2. Reserva de los datos del trabajador (Art. 154 bis CT)</h2>
<p>El empleador debe <strong>mantener reserva de toda la información y datos privados
del trabajador</strong> a que tenga acceso con ocasión de la relación laboral
(Art. 154 bis del Código del Trabajo). En la Empresa, los datos laborales se manejan
así:</p>
<table>
  <tr><th>Conjunto de datos</th><th>Quién accede</th><th>Para qué</th></tr>
  <tr><td>Carpeta del trabajador (contrato, anexos, antecedentes personales)</td><td>Recursos humanos y jefatura directa</td><td>Gestión del vínculo laboral</td></tr>
  <tr><td>Remuneraciones, descuentos, embargos, cotizaciones</td><td>Remuneraciones / contabilidad</td><td>Pago y obligaciones previsionales y tributarias</td></tr>
  <tr><td>Evaluaciones de desempeño y medidas disciplinarias</td><td>Jefatura directa y recursos humanos</td><td>Gestión del desempeño</td></tr>
  <tr><td>Salud laboral (licencias, exámenes ocupacionales, mutualidad) — dato sensible</td><td>Solo ${BLANK} (cargo), acceso restringido</td><td>Obligaciones de seguridad y salud (Ley 16.744)</td></tr>
  <tr><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
</table>
<p>Ningún dato del trabajador se comunica a terceros (bancos, ex empleadores, otras
empresas) sin su consentimiento u obligación legal. Las referencias laborales de ex
trabajadores se limitan a cargo y período, salvo autorización escrita para más.</p>

<h2>3. Reglas de selección de personal</h2>
<p>En los procesos de selección solo se recolectan los datos <strong>necesarios para
evaluar la idoneidad del postulante para el cargo</strong> (formación, experiencia,
competencias, referencias autorizadas). Conforme al principio de no discriminación
del <strong>Art. 2 del Código del Trabajo</strong> y al principio de proporcionalidad
(Art. 3° letra c de la Ley 19.628 reformada), queda <strong>prohibido exigir o
registrar</strong>:</p>
<p>— estado civil, embarazo o planes de maternidad/paternidad, número de hijos o
cargas familiares como condición de contratación;<br />
— situación socioeconómica, deudas o informes comerciales, salvo que una ley lo
habilite para el cargo específico;<br />
— datos de salud ajenos a los requisitos objetivos del cargo, exámenes no exigidos
por la normativa de seguridad del puesto, o datos genéticos;<br />
— afiliación sindical, creencias religiosas, opinión política, orientación sexual u
otros datos sensibles sin habilitación legal.</p>
<p>Los antecedentes de <strong>postulantes no seleccionados se eliminan a los 6
meses</strong> del cierre del proceso (o antes, a solicitud del postulante), conforme
a la Política de Retención y Eliminación de Datos de la Empresa. Mantenerlos "en base
de candidatos" requiere consentimiento expreso del postulante.</p>

<h2>4. Monitoreo de correo, equipos y ubicación</h2>
<p>Las facultades de administración del empleador tienen como límite los derechos
fundamentales del trabajador, incluida su vida privada (Art. 5 CT). Siguiendo los
dictámenes de la Dirección del Trabajo (Dictamen 260/19 sobre correo electrónico,
entre otros), cualquier control sobre correo corporativo, equipos, navegación o
ubicación en la Empresa cumple estas condiciones copulativas:</p>
<p><strong>a)</strong> está regulado en una <strong>política previa, escrita e
informada</strong> a los trabajadores (esta política y/o el Reglamento Interno);<br />
<strong>b)</strong> es <strong>general y objetivo</strong> (se aplica por igual a
todos o a funciones definidas), nunca dirigido a vigilar a una persona específica;<br />
<strong>c)</strong> es proporcional a una finalidad legítima (seguridad de la
información, continuidad operativa), y<br />
<strong>d)</strong> <strong>no incluye la revisión del contenido</strong> de
comunicaciones privadas del trabajador: la Empresa puede establecer reglas de uso del
correo corporativo, pero no abrir ni leer correspondencia privada, cuya inviolabilidad
está garantizada por la Constitución.</p>
<p>Sistemas de control activos en la Empresa (completar; si no hay, indicar "ninguno"):
${BLANK}.</p>

<h2>5. Datos sindicales</h2>
<p>La afiliación sindical es un dato personal cuyo tratamiento indebido puede
configurar práctica antisindical. Solo accede a él ${BLANK} (cargo), exclusivamente
para aplicar descuentos de cuotas y obligaciones legales. Está prohibido usarlo en
decisiones de contratación, evaluación, ascenso o desvinculación.</p>

<h2>6. Derechos y canal de consultas del trabajador</h2>
<p>Todo trabajador o postulante puede ejercer sus derechos de acceso, rectificación,
supresión, oposición, portabilidad y bloqueo (Arts. 4° a 11 de la Ley 19.628
reformada), y consultar cualquier duda sobre esta política, en el siguiente canal:
${BLANK} (correo/persona responsable). Las solicitudes se responden dentro de
<strong>30 días corridos</strong> y en forma gratuita. Nadie puede ser sancionado ni
perjudicado por ejercer estos derechos.</p>

<h2>7. Vigencia y toma de conocimiento</h2>
<p>Esta política rige desde su fecha de publicación, se revisa al menos una vez al año
y se pone en conocimiento de todo el personal. El trabajador que suscribe declara
haberla recibido y comprendido:</p>
<table>
  <tr><th>Representante de la Empresa</th><th>Trabajador (toma de conocimiento)</th></tr>
  <tr><td>Nombre: ${BLANK}</td><td>Nombre: ${BLANK}</td></tr>
  <tr><td>RUN: ${BLANK}</td><td>RUN: ${BLANK}</td></tr>
  <tr><td>Cargo: ${BLANK}</td><td>Cargo: ${BLANK}</td></tr>
  <tr><td>Firma: ${BLANK}</td><td>Firma: ${BLANK}</td></tr>
  <tr><td>Fecha: ${BLANK}</td><td>Fecha: ${BLANK}</td></tr>
</table>

<p style="margin-top:28px"><em>Documento tipo generado por DPC — Data Protection Compliance
como base estándar; debe completarse en los espacios en blanco y revisarse frente a la
operación real de la empresa antes de su firma y difusión interna.</em></p>`;
  },
};
