import { escapeHtml } from "../layout";
import { BLANK, type DocumentTemplate, type TemplateVars } from "./types";

/**
 * Registro de Actividades de Tratamiento (RAT) — inventario de los tratamientos
 * de datos personales de la empresa (qué datos, de quién, para qué, con qué
 * base, quién los recibe, cuánto se conservan). Es la base documental del deber
 * de información del Art. 14 ter y del principio de responsabilidad de la
 * Ley 21.719.
 *
 * ⚠️ BORRADOR PENDIENTE DE REVISIÓN LEGAL (gate pre-deploy).
 */
export const ratRegistroTratamientos: DocumentTemplate = {
  id: "rat-registro-tratamientos",
  title: "Registro de Actividades de Tratamiento (RAT)",
  summary:
    "El inventario que la ley espera poder revisar: cada actividad de tratamiento con sus datos, titulares, finalidad, base de licitud, destinatarios y plazos.",
  appliesTo: ["B-INV-001"],
  buildBodyHtml: (vars: TemplateVars) => {
    const name = escapeHtml(vars.companyName);
    const rut = escapeHtml(vars.companyRut);
    return `
<p><em>Versión 1.0 · Fecha de generación: ${escapeHtml(vars.generatedDate)} · Reemplaza a: no aplica (primera versión)</em></p>

<h2>1. Identificación del responsable</h2>
<p><strong>${name}</strong>, RUT ${rut}, con domicilio en ${BLANK}, es el responsable de
los tratamientos registrados en este documento. Responsable interno de protección de
datos y encargado de mantener este registro: ${BLANK}. Canal de contacto para materias de
datos personales: ${BLANK}.</p>

<h2>2. Qué es este registro y cómo completarlo</h2>
<p>Este Registro de Actividades de Tratamiento (RAT) inventaria, actividad por actividad,
qué datos personales trata la empresa, de quiénes, para qué, con qué base de licitud del
Art. 4° de la Ley 21.719, quién los recibe y por cuánto tiempo se conservan. Es el insumo
directo del deber de información del Art. 14 ter y la primera evidencia de gobernanza que
revisa una fiscalización: sin este inventario la empresa no puede responder a un titular,
suprimir datos a tiempo ni contener bien un incidente.</p>
<p>Instrucciones de llenado: <strong>(i)</strong> registre una fila por cada actividad de
tratamiento (un proceso de negocio que usa datos personales, no un sistema); <strong>(ii)</strong>
consulte a todas las áreas que traten datos (ventas, RR.HH., contabilidad, marketing,
soporte); <strong>(iii)</strong> si la base de licitud es el consentimiento, verifique que
exista registro de él; si es interés legítimo, documente la ponderación; <strong>(iv)</strong>
marque "Sí" en datos sensibles cuando la actividad incluya datos del Art. 2° letra g
(salud, biometría, origen étnico, afiliación sindical, vida sexual, entre otros) — esos
tratamientos exigen las condiciones reforzadas de los Arts. 16 y siguientes;
<strong>(v)</strong> revise y actualice el registro al menos una vez al año y cada vez que
se incorpore un nuevo sistema, proveedor o finalidad.</p>

<h2>3. Registro de actividades de tratamiento</h2>
<p>Las dos primeras filas van rellenadas como ejemplo típico de una pyme y deben ajustarse
a la operación real; las filas en blanco se completan con las demás actividades.</p>
<table>
  <tr>
    <th>ID / Actividad</th>
    <th>Categorías de datos</th>
    <th>Titulares</th>
    <th>Finalidad</th>
    <th>Base de licitud (Art. 4°)</th>
    <th>Destinatarios / encargados</th>
  </tr>
  <tr>
    <td>RAT-01 · Venta y facturación</td>
    <td>Identificación (nombre, RUT), contacto, dirección de despacho, detalle de compras, datos de facturación</td>
    <td>Clientes</td>
    <td>Ejecutar la venta, emitir boleta/factura, gestionar despacho y garantía</td>
    <td>Ejecución de contrato; obligación legal (normativa tributaria)</td>
    <td>SII; empresa de despacho; software de facturación (encargado, Art. 15 bis)</td>
  </tr>
  <tr>
    <td>RAT-02 · Remuneraciones y gestión laboral</td>
    <td>Identificación, contacto, cargo, remuneración, cotizaciones previsionales y de salud, licencias médicas</td>
    <td>Trabajadores</td>
    <td>Pagar remuneraciones y cotizaciones, cumplir obligaciones laborales y previsionales</td>
    <td>Contrato de trabajo; obligación legal</td>
    <td>Previred; AFP e isapres/Fonasa; contador externo (encargado, Art. 15 bis)</td>
  </tr>
  <tr>
    <td>RAT-03 · Marketing y promociones</td>
    <td>Nombre, correo electrónico, teléfono, historial de compras</td>
    <td>Clientes y prospectos</td>
    <td>Enviar comunicaciones comerciales y promociones</td>
    <td>Consentimiento (revocable en todo momento)</td>
    <td>Plataforma de e-mail marketing (encargado, Art. 15 bis)</td>
  </tr>
  <tr><td>RAT-04 · ${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
  <tr><td>RAT-05 · ${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
</table>

<h2>4. Detalle complementario por actividad</h2>
<p>Complete esta tabla para las mismas actividades de la sección anterior:</p>
<table>
  <tr>
    <th>ID</th>
    <th>Transferencia internacional y país</th>
    <th>Plazo de conservación</th>
    <th>Medidas de seguridad</th>
    <th>¿Datos sensibles?</th>
    <th>¿Decisiones automatizadas?</th>
  </tr>
  <tr>
    <td>RAT-01</td>
    <td>Sí — nube del software de facturación (país: ${BLANK})</td>
    <td>6 años (documentación tributaria); luego supresión o anonimización</td>
    <td>Acceso con credenciales individuales; respaldo del proveedor</td>
    <td>No</td>
    <td>No</td>
  </tr>
  <tr>
    <td>RAT-02</td>
    <td>No</td>
    <td>Durante la relación laboral y los plazos de prescripción laboral/previsional; luego supresión</td>
    <td>Carpetas de personal con acceso restringido; confidencialidad del contador</td>
    <td>Sí (licencias médicas — dato de salud, Art. 16 y siguientes)</td>
    <td>No</td>
  </tr>
  <tr>
    <td>RAT-03</td>
    <td>Sí — plataforma de e-mail marketing (país: ${BLANK})</td>
    <td>Hasta la revocación del consentimiento o supresión solicitada por el titular</td>
    <td>Acceso restringido; baja inmediata al revocar (opt-out en cada envío)</td>
    <td>No</td>
    <td>${BLANK} (indicar si hay segmentación o perfilado automatizado, Art. 8° bis)</td>
  </tr>
  <tr><td>RAT-04</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
  <tr><td>RAT-05</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
</table>

<h2>5. Control de versiones</h2>
<table>
  <tr><th>Versión</th><th>Fecha</th><th>Responsable</th><th>Cambios</th></tr>
  <tr><td>1.0</td><td>${BLANK}</td><td>${BLANK}</td><td>Levantamiento inicial del registro</td></tr>
  <tr><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td><td>${BLANK}</td></tr>
</table>
<p>Próxima revisión programada: ${BLANK}. El registro debe actualizarse ante cualquier
nueva actividad, sistema, encargado o cambio de finalidad (un cambio de finalidad requiere
nueva base de licitud, Art. 3° y 4°).</p>

<p style="margin-top:28px"><em>Documento tipo generado por DPC — Data Protection Compliance
como base estándar; debe completarse en los espacios en blanco y revisarse frente a la
operación real de la empresa antes de su uso.</em></p>`;
  },
};
