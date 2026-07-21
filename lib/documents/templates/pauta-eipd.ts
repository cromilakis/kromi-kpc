import { escapeHtml } from "../layout";
import { BLANK, type DocumentTemplate, type TemplateVars } from "./types";

/**
 * Pauta de Evaluación de Impacto en Protección de Datos (EIPD) — para
 * tratamientos de alto riesgo (Art. 15 ter): decisiones automatizadas con
 * efectos significativos, tratamiento masivo, monitoreo sistemático o datos
 * sensibles. Incluye la sección de transparencia de decisiones automatizadas
 * (Art. 8° bis).
 *
 * ⚠️ BORRADOR PENDIENTE DE REVISIÓN LEGAL (gate pre-deploy).
 */
export const pautaEipd: DocumentTemplate = {
  id: "pauta-eipd",
  title: "Pauta de Evaluación de Impacto (EIPD) y Decisiones Automatizadas",
  summary:
    "La evaluación previa que exige la ley para tratamientos de alto riesgo, más el aviso de decisiones automatizadas (Arts. 15 ter y 8° bis).",
  appliesTo: ["B-EIA-001", "B-EIA-002"],
  buildBodyHtml: (vars: TemplateVars) => {
    const name = escapeHtml(vars.companyName);
    const rut = escapeHtml(vars.companyRut);
    return `
<p><em>Responsable: ${name} · RUT ${rut} · Fecha de evaluación: ${escapeHtml(vars.generatedDate)} · Evaluador: ${BLANK}</em></p>

<h2>1. ¿Cuándo usar esta pauta?</h2>
<p>La ley exige una Evaluación de Impacto en Protección de Datos <strong>previa y
documentada</strong> (Art. 15 ter) cuando el tratamiento puede suponer alto riesgo:
(a) decisiones automatizadas con efectos jurídicos o significativos para las personas;
(b) tratamiento masivo o a gran escala; (c) monitoreo sistemático de zonas de acceso
público; (d) datos sensibles en los casos que la ley señala. Complete una pauta por cada
sistema o tratamiento evaluado.</p>

<h2>2. Descripción del tratamiento evaluado</h2>
<table>
  <tr><th>Aspecto</th><th>Detalle</th></tr>
  <tr><td>Sistema o proceso</td><td>${BLANK} (ej.: motor de scoring, filtro de postulantes, precios por perfil)</td></tr>
  <tr><td>Finalidad</td><td>${BLANK}</td></tr>
  <tr><td>Datos que utiliza</td><td>${BLANK}</td></tr>
  <tr><td>Titulares afectados y volumen</td><td>${BLANK}</td></tr>
  <tr><td>¿Decide sin intervención humana?</td><td>☐ Sí &nbsp; ☐ No &nbsp; ☐ Parcial: ${BLANK}</td></tr>
  <tr><td>Proveedor o tecnología</td><td>${BLANK}</td></tr>
  <tr><td>Base de licitud del tratamiento</td><td>${BLANK}</td></tr>
</table>

<h2>3. Evaluación de necesidad y proporcionalidad</h2>
<p>Responda por escrito: ¿la finalidad puede lograrse con menos datos o sin decisión
automatizada? ¿Los datos utilizados son los estrictamente necesarios? ¿El beneficio del
tratamiento justifica el riesgo para las personas?</p>
<p>${BLANK}</p>

<h2>4. Identificación de riesgos para los titulares</h2>
<table>
  <tr><th>Riesgo</th><th>¿Aplica?</th><th>Gravedad / probabilidad</th></tr>
  <tr><td>Decisión errónea que niega un servicio, crédito o empleo</td><td>☐</td><td>${BLANK}</td></tr>
  <tr><td>Discriminación por sesgos en los datos o el modelo</td><td>☐</td><td>${BLANK}</td></tr>
  <tr><td>Uso de datos para fines distintos del informado</td><td>☐</td><td>${BLANK}</td></tr>
  <tr><td>Filtración o acceso indebido a los datos del sistema</td><td>☐</td><td>${BLANK}</td></tr>
  <tr><td>Falta de transparencia (el titular no sabe que se le evalúa)</td><td>☐</td><td>${BLANK}</td></tr>
  <tr><td>Otro: ${BLANK}</td><td>☐</td><td>${BLANK}</td></tr>
</table>

<h2>5. Medidas de mitigación</h2>
<p>Para cada riesgo identificado, defina la medida, el responsable y el plazo:</p>
<table>
  <tr><th>Riesgo</th><th>Medida</th><th>Responsable</th><th>Plazo</th></tr>
  <tr><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
  <tr><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
</table>

<h2>6. Transparencia y revisión humana (Art. 8° bis)</h2>
<p>Si el sistema toma decisiones automatizadas con efectos significativos, la ley reconoce
al titular el derecho a ser informado, a obtener una explicación, a expresar su punto de
vista y a solicitar la <strong>intervención de una persona</strong>. Verifique:</p>
<table>
  <tr><th>Salvaguarda</th><th>Estado</th></tr>
  <tr><td>Se informa al titular que existe una decisión automatizada y su lógica general (ej. en la política de privacidad y en el punto de la decisión)</td><td>☐ Implementado &nbsp; ☐ Pendiente</td></tr>
  <tr><td>Existe una vía simple y publicada para pedir revisión humana</td><td>☐ Implementado &nbsp; ☐ Pendiente</td></tr>
  <tr><td>La revisión humana es efectiva: quien revisa puede cambiar la decisión</td><td>☐ Implementado &nbsp; ☐ Pendiente</td></tr>
</table>
<p><strong>Texto tipo de aviso al titular:</strong> «Esta evaluación se realiza mediante un
sistema automatizado que considera ${BLANK}. Usted tiene derecho a solicitar que una
persona revise la decisión, a expresar su punto de vista y a obtener una explicación,
escribiendo a ${BLANK}.»</p>

<h2>7. Conclusión de la evaluación</h2>
<p>☐ El tratamiento puede realizarse con las medidas comprometidas. &nbsp;
☐ El tratamiento debe modificarse antes de operar. &nbsp;
☐ El tratamiento no debe realizarse.</p>
<p>Fundamento: ${BLANK}</p>
<p>Próxima revisión (ante cambios relevantes o a más tardar en 12 meses): ${BLANK}</p>

<p style="margin-top:28px">
Evaluador: ${BLANK} · Cargo: ${BLANK} · Firma: ${BLANK}<br/>
Responsable de protección de datos: ${BLANK} · Firma: ${BLANK}
</p>

<p style="margin-top:28px"><em>Documento tipo generado por DPC — Data Protection Compliance
como base estándar; debe completarse y revisarse frente a la operación real de la empresa.</em></p>`;
  },
};
