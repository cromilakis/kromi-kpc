import { escapeHtml } from "../layout";
import { BLANK, type DocumentTemplate, type TemplateVars } from "./types";

/**
 * Aviso de Videovigilancia y Protocolo de Cámaras — dos piezas en un documento:
 * (A) el texto del cartel que se imprime y ubica en accesos y zonas con cámaras
 * (deber de información, Art. 14 ter y DFL 3/2025) y (B) el protocolo interno
 * de operación: inventario de cámaras, zonas prohibidas (Art. 161-A Código
 * Penal y dictámenes DT), retención máxima de 30 días, acceso restringido a
 * grabaciones y entrega solo a autoridad competente.
 *
 * ⚠️ BORRADOR PENDIENTE DE REVISIÓN LEGAL (gate pre-deploy).
 */
export const avisoVideovigilancia: DocumentTemplate = {
  id: "aviso-videovigilancia",
  title: "Aviso de Videovigilancia y Protocolo de Cámaras",
  summary:
    "El cartel de zona vigilada para imprimir y el protocolo interno de cámaras: inventario, zonas prohibidas, retención de 30 días y acceso restringido.",
  appliesTo: ["B-CCT-001"],
  buildBodyHtml: (vars: TemplateVars) => {
    const name = escapeHtml(vars.companyName);
    const rut = escapeHtml(vars.companyRut);
    return `
<p><em>Versión 1.0 · Fecha de generación: ${escapeHtml(vars.generatedDate)} · Reemplaza a: no aplica (primera versión)</em></p>

<h2>Parte A — Texto del cartel de zona vigilada</h2>
<p>Imprimir el siguiente texto en tamaño legible a distancia (se sugiere formato carta
o superior, con pictograma de cámara) y ubicarlo en <strong>todos los accesos</strong>
al recinto y en cada zona cubierta por cámaras, <strong>antes</strong> de que la
persona entre al campo de visión:</p>
<table>
  <tr><th>CARTEL — ZONA VIGILADA POR CÁMARAS DE SEGURIDAD</th></tr>
  <tr><td>
    <p><strong>ZONA VIGILADA POR CÁMARAS DE SEGURIDAD</strong></p>
    <p><strong>Responsable:</strong> ${name}, RUT ${rut}.</p>
    <p><strong>Finalidad:</strong> seguridad de las personas, de las instalaciones y de los bienes.</p>
    <p><strong>Conservación:</strong> las grabaciones se eliminan a los 30 días, salvo incidente en investigación.</p>
    <p><strong>Sus derechos:</strong> puede ejercer los derechos de acceso, rectificación, supresión y oposición
    (Ley 19.628, reformada por la Ley 21.719) escribiendo a ${BLANK} (correo/teléfono).</p>
  </td></tr>
</table>

<h2>Parte B — Protocolo interno de operación de cámaras</h2>

<h2>1. Alcance y responsable del sistema</h2>
<p>Este protocolo regula la instalación, operación y custodia del sistema de
videovigilancia de <strong>${name}</strong>. El responsable interno del sistema
(instalación, retención, accesos y registros) es ${BLANK} (cargo). Toda cámara
nueva, reubicación o cambio de finalidad requiere su aprobación previa y la
actualización del inventario de la sección 2.</p>

<h2>2. Inventario de cámaras</h2>
<p>La Empresa mantiene el inventario completo y actualizado de sus cámaras. Ninguna
cámara puede operar fuera de este inventario:</p>
<table>
  <tr><th>N°</th><th>Ubicación física</th><th>Zona que cubre</th><th>¿Apunta a zona privada?</th></tr>
  <tr><td>1</td><td>${BLANK}</td><td>${BLANK}</td><td>NO (obligatorio)</td></tr>
  <tr><td>2</td><td>${BLANK}</td><td>${BLANK}</td><td>NO (obligatorio)</td></tr>
  <tr><td>3</td><td>${BLANK}</td><td>${BLANK}</td><td>NO (obligatorio)</td></tr>
  <tr><td>4</td><td>${BLANK}</td><td>${BLANK}</td><td>NO (obligatorio)</td></tr>
</table>
<p><strong>Zonas prohibidas.</strong> Queda estrictamente prohibido instalar cámaras
—o encuadrarlas de modo que capten, aunque sea parcialmente— <strong>baños,
vestidores, camarines o comedores</strong> y, en general, espacios de descanso o de
uso privado. Grabar en recintos privados sin consentimiento puede configurar el
delito del <strong>Art. 161-A del Código Penal</strong>, y la Dirección del Trabajo
ha resuelto que la videovigilancia laboral solo se justifica por razones objetivas
de seguridad, con conocimiento previo de los trabajadores y sin vulnerar su dignidad
ni servir como mecanismo de vigilancia permanente y dirigida del desempeño
(Dictamen 2210/035, entre otros).</p>

<h2>3. Retención y sobrescritura</h2>
<p>Las grabaciones se conservan por un <strong>máximo de 30 días</strong>, con
sobrescritura automática configurada en el equipo grabador, en línea con el estándar
del <strong>DFL 3/2025</strong> (nueva Ley de Seguridad Privada) y el principio de
proporcionalidad (Art. 3° letra c). Excepción: si un fragmento registra un incidente
(delito, accidente, reclamo en curso), se extrae y conserva solo ese fragmento,
bloqueado, hasta que concluya la investigación o el requerimiento, dejando constancia
de quién lo extrajo, cuándo y por qué.</p>

<h2>4. Acceso a las grabaciones</h2>
<p>El acceso al sistema y a las grabaciones queda restringido a las siguientes
personas, cada una con credencial individual (prohibido compartir claves):</p>
<table>
  <tr><th>Nombre</th><th>Cargo</th><th>Tipo de acceso</th></tr>
  <tr><td>${BLANK}</td><td>${BLANK}</td><td>Visualización / extracción</td></tr>
  <tr><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
</table>
<p>Toda visualización de grabaciones históricas y toda extracción de fragmentos se
anota en un <strong>registro de visualizaciones</strong>: fecha, persona, cámara,
tramo revisado y motivo. Está prohibido usar las cámaras para monitorear el
desempeño de un trabajador específico, difundir imágenes o publicarlas en redes
sociales o grupos de mensajería.</p>

<h2>5. Entrega de grabaciones a terceros</h2>
<p>Las grabaciones solo se entregan a <strong>autoridad competente</strong>
(Ministerio Público, tribunales, policías con orden o requerimiento formal) o cuando
una ley lo exija. Toda entrega se documenta: solicitante, fundamento, fecha y
fragmento entregado. No se entregan copias a particulares, clientes o trabajadores
fuera del ejercicio formal de sus derechos ante el canal de la sección A.</p>

<h2>6. Firmas</h2>
<table>
  <tr><th>Representante legal de la Empresa</th><th>Responsable del sistema de cámaras</th></tr>
  <tr><td>Nombre: ${BLANK}</td><td>Nombre: ${BLANK}</td></tr>
  <tr><td>RUN: ${BLANK}</td><td>RUN: ${BLANK}</td></tr>
  <tr><td>Firma: ${BLANK}</td><td>Firma: ${BLANK}</td></tr>
  <tr><td>Fecha: ${BLANK}</td><td>Fecha: ${BLANK}</td></tr>
</table>

<p style="margin-top:28px"><em>Documento tipo generado por DPC — Data Protection Compliance
como base estándar; debe completarse en los espacios en blanco y revisarse frente a la
operación real de la empresa antes de su firma y publicación del cartel.</em></p>`;
  },
};
