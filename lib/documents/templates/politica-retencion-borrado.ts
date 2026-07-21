import { escapeHtml } from "../layout";
import { BLANK, type DocumentTemplate, type TemplateVars } from "./types";

/**
 * Política de Retención y Eliminación de Datos — fija por escrito cuánto tiempo
 * conserva la empresa cada categoría de datos personales y cómo los elimina de
 * forma segura cuando ya no son necesarios, en cumplimiento del principio de
 * proporcionalidad/limitación del plazo (Art. 3° letra c) y del deber de
 * suprimir los datos cuya finalidad se agotó (Art. 14 letra d, Ley 19.628
 * reformada por la Ley 21.719).
 *
 * ⚠️ BORRADOR PENDIENTE DE REVISIÓN LEGAL (gate pre-deploy).
 */
export const politicaRetencionBorrado: DocumentTemplate = {
  id: "politica-retencion-borrado",
  title: "Política de Retención y Eliminación de Datos",
  summary:
    "Cuánto tiempo se conserva cada categoría de datos y cómo se eliminan de forma segura cuando la finalidad o la ley ya no exigen conservarlos.",
  appliesTo: ["B-CON-001"],
  buildBodyHtml: (vars: TemplateVars) => {
    const name = escapeHtml(vars.companyName);
    const rut = escapeHtml(vars.companyRut);
    return `
<p><em>Versión 1.0 · Fecha de publicación: ${escapeHtml(vars.generatedDate)} · Reemplaza a: no aplica (primera versión)</em></p>

<h2>1. Objeto y alcance</h2>
<p>Esta política regula cuánto tiempo conserva <strong>${name}</strong>, RUT ${rut}
(en adelante, "la Empresa"), los datos personales que trata, y cómo los elimina o
anonimiza de forma segura una vez cumplido ese plazo. Aplica a todos los datos
personales de clientes, trabajadores, postulantes, proveedores y demás titulares,
cualquiera sea su soporte (sistemas, correos, planillas, respaldos o papel), y obliga
a todo el personal y a los encargados que traten datos por cuenta de la Empresa.</p>

<h2>2. Principio general</h2>
<p>Los datos personales se conservan <strong>solo mientras subsista la finalidad</strong>
que justificó su recolección o mientras una ley exija mantenerlos (por ejemplo,
normativa tributaria o laboral). Cumplido el plazo, los datos se <strong>eliminan,
anonimizan o bloquean</strong> según corresponda, conforme al principio de
proporcionalidad y limitación del plazo de conservación (Art. 3° letra c) y al deber
del responsable de suprimir los datos cuando la finalidad se agotó (Art. 14 letra d,
Ley 19.628 reformada por la Ley 21.719). "Podría servir después" no es una finalidad:
la conservación indefinida por defecto queda prohibida.</p>

<h2>3. Plazos de conservación por categoría</h2>
<p>La siguiente tabla fija los plazos de la Empresa. Los plazos legales priman sobre
los operativos; ante conflicto entre finalidades, se aplica el plazo más largo que
tenga sustento legal y luego se elimina.</p>
<table>
  <tr><th>Categoría de datos</th><th>Plazo de conservación</th><th>Fundamento</th></tr>
  <tr><td>Documentación tributaria y contable (facturas, boletas, libros)</td><td>6 años</td><td>Art. 17 Código Tributario / normativa SII</td></tr>
  <tr><td>Documentación laboral y previsional (contratos, remuneraciones, cotizaciones, finiquitos)</td><td>Durante la relación laboral y los plazos de prescripción y fiscalización aplicables (DT, previsional)</td><td>Código del Trabajo y normativa previsional</td></tr>
  <tr><td>Fichas clínicas (solo si la Empresa es prestador de salud)</td><td>15 años desde la última atención</td><td>Ley 20.584 y Decreto 41/2013 MINSAL</td></tr>
  <tr><td>Datos de marketing (correos, teléfonos para promociones)</td><td>Hasta la revocación del consentimiento o la oposición del titular</td><td>Art. 12 — consentimiento revocable</td></tr>
  <tr><td>Currículos y antecedentes de postulantes no seleccionados</td><td>6 meses desde el cierre del proceso; luego se eliminan (o antes, si el postulante lo pide)</td><td>Finalidad agotada (Art. 3° c y 14 d)</td></tr>
  <tr><td>Grabaciones de videovigilancia (CCTV)</td><td>30 días con sobrescritura automática, salvo incidente en investigación o requerimiento de autoridad</td><td>DFL 3/2025 (seguridad privada) y proporcionalidad</td></tr>
  <tr><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
  <tr><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
  <tr><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
</table>
<p>Cuando una ley obliga a conservar un documento que contiene datos personales más
allá de la finalidad original (por ejemplo, respaldo tributario), los datos se
mantienen <strong>bloqueados</strong>: solo disponibles para esa obligación legal, sin
otros usos.</p>

<h2>4. Procedimiento de eliminación segura</h2>
<p><strong>a) Soporte digital.</strong> La eliminación debe ser verificable y alcanzar
todas las copias: sistemas y aplicaciones, carpetas compartidas, correos, planillas
locales, <strong>papeleras de reciclaje y respaldos</strong> (o, si el respaldo no
permite borrado selectivo, expiración del respaldo dentro de su ciclo de rotación,
dejando constancia). No basta "enviar a la papelera": se usa borrado definitivo y,
para equipos o discos dados de baja, borrado seguro o destrucción física del medio.</p>
<p><strong>b) Soporte papel.</strong> Los documentos con datos personales se destruyen
de forma irreversible (trituración o servicio de destrucción certificada). Queda
prohibido desechar en la basura común documentos legibles con datos personales, o
reutilizarlos como borrador por el reverso.</p>
<p><strong>c) Anonimización.</strong> Como alternativa a la eliminación, los datos
pueden anonimizarse de manera irreversible (por ejemplo, para estadísticas). Un dato
seudonimizado o "despersonalizado a medias" sigue siendo dato personal y sigue sujeto
a esta política.</p>
<p><strong>d) Registro.</strong> Cada eliminación o anonimización masiva se registra:
fecha, categoría de datos, soporte, método y responsable de la ejecución.</p>

<h2>5. Encargados y terceros</h2>
<p>Los prestadores que tratan datos por cuenta de la Empresa (Art. 15 bis) deben
aplicar estos mismos plazos y, al término del encargo, devolver o eliminar los datos
según instruya la Empresa, dejando constancia escrita.</p>

<h2>6. Revisión anual y responsable</h2>
<p>Esta política y su tabla de plazos se revisan <strong>al menos una vez al año</strong>
y cada vez que cambie la normativa o se incorpore un nuevo tratamiento. El responsable
de mantenerla, ejecutar los ciclos de eliminación y custodiar los registros es
${BLANK} (cargo), quien reporta a ${BLANK}.</p>

<h2>7. Vigencia</h2>
<p>Esta política rige desde su fecha de publicación y obliga a todo el personal de la
Empresa. Su incumplimiento puede configurar infracciones a la Ley 21.719 y a los
reglamentos internos de la Empresa.</p>

<p style="margin-top:28px"><em>Documento tipo generado por DPC — Data Protection Compliance
como base estándar; debe completarse en los espacios en blanco y revisarse frente a la
operación real de la empresa antes de su publicación.</em></p>`;
  },
};
