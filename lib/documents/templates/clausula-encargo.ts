import { escapeHtml } from "../layout";
import { BLANK, type DocumentTemplate, type TemplateVars } from "./types";

/**
 * Contrato / Cláusula de Encargo de Tratamiento de Datos — regula el
 * tratamiento de datos por cuenta de otro conforme al Art. 15 bis de la Ley
 * 21.719. Uso dual: como responsable (la empresa contrata proveedores que
 * tratan sus datos) o como encargada (la empresa presta servicios tratando
 * datos de sus clientes). Adaptado de la cláusula tipo basada en la Guía SGD.
 *
 * ⚠️ BORRADOR PENDIENTE DE REVISIÓN LEGAL (gate pre-deploy).
 */
export const clausulaEncargo: DocumentTemplate = {
  id: "clausula-encargo",
  title: "Contrato / Cláusula de Encargo de Tratamiento de Datos",
  summary:
    "El contrato que la ley exige cuando un tercero trata datos por cuenta de la empresa —o la empresa por cuenta de sus clientes— (Art. 15 bis).",
  appliesTo: ["B-TER-001", "B-CON-002", "B-ENC-001"],
  buildBodyHtml: (vars: TemplateVars) => {
    const name = escapeHtml(vars.companyName);
    const rut = escapeHtml(vars.companyRut);
    return `
<p><em>Versión 1.0 · Fecha de generación: ${escapeHtml(vars.generatedDate)} · Para insertar como cláusula en un contrato de servicios o suscribir como contrato independiente.</em></p>

<h2>1. Objeto</h2>
<p>Por el presente instrumento, el <strong>Responsable</strong> encomienda al
<strong>Encargado</strong> el tratamiento de datos personales por su cuenta, conforme al
<strong>Art. 15 bis</strong> de la Ley 19.628, reformada por la Ley 21.719, y a las
instrucciones e indicaciones que aquí se documentan. El Encargado no adquiere derecho alguno
sobre los datos y solo puede tratarlos para ejecutar el servicio contratado.</p>

<h2>2. Identificación de las partes</h2>
<table>
  <tr><th>Parte</th><th>Razón social</th><th>RUT</th><th>Domicilio</th></tr>
  <tr><td><strong>Responsable</strong></td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
  <tr><td><strong>Encargado</strong></td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
</table>
<p>Contacto del Responsable para materias de datos personales (delegado o responsable
interno, si existe): ${BLANK}. Contacto equivalente del Encargado: ${BLANK}.</p>
<p><em>Complete la fila que corresponda a la contraparte. Los datos de ${name}, RUT ${rut},
van en la fila del rol que la empresa asuma según la nota de uso de la sección 9.</em></p>

<h2>3. Descripción del tratamiento encomendado</h2>
<table>
  <tr><th>Elemento</th><th>Descripción</th></tr>
  <tr><td>Categorías de datos personales</td><td>${BLANK} (p. ej. identificación, contacto, financieros, salud)</td></tr>
  <tr><td>Categorías de titulares</td><td>${BLANK} (p. ej. clientes, trabajadores, pacientes)</td></tr>
  <tr><td>Naturaleza y finalidad del tratamiento</td><td>${BLANK}</td></tr>
  <tr><td>Operaciones de tratamiento</td><td>${BLANK} (p. ej. recolección, almacenamiento, procesamiento, comunicación)</td></tr>
  <tr><td>Duración del encargo</td><td>${BLANK} (vigencia del contrato de servicios o plazo específico)</td></tr>
</table>

<h2>4. Obligaciones del Encargado</h2>
<p>El Encargado se obliga a:</p>
<p><strong>4.1 Instrucciones documentadas.</strong> Tratar los datos únicamente conforme a
las instrucciones documentadas del Responsable y a lo establecido en este instrumento, sin
usarlos para finalidades propias ni distintas de las pactadas.</p>
<p><strong>4.2 Confidencialidad.</strong> Guardar secreto sobre los datos y asegurar que las
personas autorizadas a tratarlos se hayan obligado a confidencialidad, deber que subsiste
incluso después de terminada la relación contractual.</p>
<p><strong>4.3 Medidas de seguridad.</strong> Implementar medidas técnicas y organizativas
apropiadas para garantizar la confidencialidad, integridad, disponibilidad y resiliencia de
los datos (Art. 14 quinquies), considerando el riesgo del tratamiento encomendado.</p>
<p><strong>4.4 Subcontratación.</strong> No subcontratar tratamientos de datos sin
<strong>autorización previa y por escrito</strong> del Responsable. Autorizada una
subcontratación, impondrá al subencargado por escrito estas mismas obligaciones y responderá
ante el Responsable por su cumplimiento.</p>
<p><strong>4.5 Notificación de brechas.</strong> Comunicar al Responsable, sin dilación
indebida y en un plazo <strong>máximo de 24 horas</strong> desde que tome conocimiento, toda
vulneración de seguridad que afecte los datos objeto del encargo, indicando al menos: (a) la
naturaleza de la brecha; (b) categorías y número aproximado de titulares afectados; (c)
categorías y volumen aproximado de registros afectados; (d) medidas adoptadas o propuestas; y
(e) un punto de contacto.</p>
<p><strong>4.6 Colaboración en derechos y evaluaciones.</strong> Colaborar con el Responsable
en la atención de las solicitudes de derechos de los titulares (acceso, rectificación,
supresión, oposición, portabilidad y bloqueo), en las evaluaciones de impacto en protección
de datos y en las consultas o fiscalizaciones de la Agencia de Protección de Datos
Personales.</p>
<p><strong>4.7 Supresión o devolución.</strong> Al término del encargo, suprimir o devolver
al Responsable, a elección de éste, todos los datos personales y sus copias, salvo obligación
legal de conservación, dejando constancia escrita.</p>
<p><strong>4.8 Auditoría.</strong> Poner a disposición del Responsable la información
necesaria para demostrar el cumplimiento de estas obligaciones, y permitir y contribuir a las
auditorías que realice el Responsable o un auditor independiente designado por éste, con
aviso previo razonable.</p>

<h2>5. Responsabilidad</h2>
<p>El Encargado responde de los daños que cause al Responsable, a los titulares o a terceros
por el incumplimiento de estas obligaciones o de la Ley 19.628 reformada por la Ley 21.719.
Si el Encargado destina los datos a un fin distinto del encomendado o los comunica o cede
infringiendo este instrumento, será considerado responsable del tratamiento para todos los
efectos legales, sin perjuicio de las demás acciones que procedan.</p>

<h2>6. Vigencia</h2>
<p>Estas obligaciones rigen durante toda la prestación del servicio y subsisten después de su
término respecto de la información que el Encargado haya conocido con ocasión del encargo.</p>

<h2>7. Nota de uso dual</h2>
<p><em>Este documento sirve en ambos sentidos: (a) si ${name} contrata proveedores que tratan
datos por su cuenta (soporte informático, contabilidad, marketing, nube administrada), la
empresa firma como <strong>Responsable</strong> y el proveedor como Encargado; (b) si ${name}
presta servicios tratando datos de sus clientes, la empresa firma como
<strong>Encargada</strong> y el cliente como Responsable. Complete la sección 2 según el rol
que corresponda.</em></p>

<h2>8. Firmas</h2>
<table>
  <tr><th>Por el Responsable</th><th>Por el Encargado</th></tr>
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
