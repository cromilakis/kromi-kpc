import { escapeHtml } from "../layout";
import { BLANK, type DocumentTemplate, type TemplateVars } from "./types";

/**
 * Política de Seguridad de la Información y Control de Accesos — reglas
 * mínimas de seguridad que la empresa adopta para cumplir el deber de
 * seguridad del Art. 14 quinquies de la Ley 21.719: cuentas individuales,
 * mínimo privilegio, contraseñas y MFA, nube empresarial, cifrado, respaldos,
 * bitácoras y revocación de accesos.
 *
 * ⚠️ BORRADOR PENDIENTE DE REVISIÓN LEGAL (gate pre-deploy).
 */
export const politicaSeguridadAccesos: DocumentTemplate = {
  id: "politica-seguridad-accesos",
  title: "Política de Seguridad de la Información y Control de Accesos",
  summary:
    "Las reglas mínimas de seguridad y control de accesos que la ley exige adoptar sobre los datos personales (Art. 14 quinquies).",
  appliesTo: ["B-SEG-001", "B-SEG-002"],
  buildBodyHtml: (vars: TemplateVars) => {
    const name = escapeHtml(vars.companyName);
    const rut = escapeHtml(vars.companyRut);
    return `
<p><em>Versión 1.0 · Fecha de aprobación: ${escapeHtml(vars.generatedDate)} · Reemplaza a: no aplica (primera versión)</em></p>

<h2>1. Objeto y alcance</h2>
<p>Esta política establece las reglas mínimas de seguridad de la información y de control de
accesos que <strong>${name}</strong>, RUT ${rut}, aplica sobre los datos personales que trata,
en cumplimiento del deber de adoptar medidas de seguridad del <strong>Art. 14 quinquies</strong>
de la Ley 19.628, reformada por la Ley 21.719. Obliga a todo el personal de la empresa
—propio y externo— que acceda a sistemas, cuentas, equipos, archivos o documentos que
contengan datos personales, cualquiera sea su cargo o modalidad de contratación.</p>

<h2>2. Principios (Art. 14 quinquies)</h2>
<p>Las medidas de esta política buscan garantizar, en un nivel apropiado al riesgo de cada
tratamiento, la <strong>confidencialidad</strong> (solo accede quien está autorizado), la
<strong>integridad</strong> (los datos no se alteran ni destruyen indebidamente) y la
<strong>disponibilidad</strong> (los datos están accesibles y recuperables cuando se
necesitan) de los datos personales, así como la <strong>resiliencia</strong> de los sistemas
que los tratan. La seguridad se evalúa considerando el estado de la técnica, los costos y la
naturaleza, alcance y fines del tratamiento.</p>

<h2>3. Reglas mínimas obligatorias</h2>

<h2>3.1 Cuentas individuales</h2>
<p>Cada persona accede a los sistemas con una <strong>cuenta individual e intransferible</strong>.
Queda <strong>prohibido</strong> el uso de usuarios o claves compartidas ("usuario caja",
"usuario admin común") en cualquier sistema que contenga datos personales. Toda acción en los
sistemas debe poder atribuirse a una persona determinada.</p>

<h2>3.2 Mínimo privilegio</h2>
<p>Cada cuenta tiene únicamente los permisos necesarios para la función de su titular. Los
permisos de administración se limitan al mínimo de personas indispensable. Los accesos se
revisan al menos <strong>una vez al año</strong> y ante cada cambio de funciones.</p>

<h2>3.3 Contraseñas y autenticación reforzada (MFA)</h2>
<p>Las contraseñas son personales, robustas (largo mínimo ${BLANK} caracteres), no se
comparten ni se anotan a la vista, y se cambian de inmediato ante sospecha de compromiso. En
todos los servicios que lo permitan —correo, nube, sistemas de gestión, banca— se activa la
<strong>autenticación de múltiples factores (MFA)</strong>, en especial para cuentas con
acceso a datos personales o permisos de administración.</p>

<h2>3.4 Cuentas de nube empresariales</h2>
<p>Los datos de la empresa se almacenan y comparten <strong>solo en cuentas empresariales</strong>
contratadas y administradas por ${name}. Queda <strong>prohibido</strong> usar cuentas
personales (Gmail, Hotmail/Outlook personal, Dropbox personal, WhatsApp personal u otras) para
almacenar, enviar o respaldar datos personales de clientes, trabajadores o proveedores. La
empresa conserva el control de acceso y la titularidad de la información en todo momento.</p>

<h2>3.5 Cifrado de dispositivos</h2>
<p>Los computadores, notebooks, teléfonos y unidades de almacenamiento que contengan datos
personales usan <strong>cifrado de disco</strong> (BitLocker, FileVault o equivalente) y
bloqueo automático con clave o biometría. El extravío o robo de un dispositivo se reporta de
inmediato conforme al plan de respuesta ante incidentes.</p>

<h2>3.6 Respaldos periódicos y probados</h2>
<p>La información con datos personales se respalda con frecuencia ${BLANK} en un medio
separado del original. La restauración de los respaldos se <strong>prueba</strong> al menos
${BLANK} veces al año, dejando constancia; un respaldo que no se ha probado no se considera
respaldo.</p>

<h2>3.7 Bitácoras de acceso</h2>
<p>En los sistemas que lo permitan se mantienen activados los <strong>registros de acceso y
actividad</strong> (logs), que se conservan por al menos ${BLANK} y se revisan ante cualquier
sospecha de acceso indebido. Estos registros solo se usan para fines de seguridad y control.</p>

<h2>3.8 Escritorio limpio y archivos locales</h2>
<p>Los documentos físicos con datos personales se guardan bajo llave y no quedan a la vista de
terceros. Queda restringida la mantención de <strong>planillas o archivos locales</strong>
(Excel u otros) con datos personales fuera de los sistemas autorizados; los archivos de
trabajo transitorios se eliminan cuando dejan de ser necesarios.</p>

<h2>3.9 Revocación de accesos al término de funciones</h2>
<p>Al término de la relación laboral o del contrato de servicios, o ante un cambio de
funciones, los accesos de la persona se <strong>revocan o ajustan el mismo día</strong> del
término o cambio: cuentas de sistemas y correo, nube, llaves, tarjetas y dispositivos. El
responsable indicado en la sección 4 verifica y deja constancia de la revocación.</p>

<h2>4. Responsables</h2>
<table>
  <tr><th>Función</th><th>Responsable (nombre y cargo)</th></tr>
  <tr><td>Responsable general de esta política</td><td>${BLANK}</td></tr>
  <tr><td>Administración de cuentas y permisos (altas, bajas, revisiones)</td><td>${BLANK}</td></tr>
  <tr><td>Respaldos y su verificación</td><td>${BLANK}</td></tr>
  <tr><td>Revocación de accesos al término de funciones</td><td>${BLANK}</td></tr>
</table>

<h2>5. Incumplimientos y sanciones internas</h2>
<p>El incumplimiento de esta política se considera una infracción a las obligaciones que
impone la relación laboral o contractual y puede dar lugar a las medidas del Reglamento
Interno de Orden, Higiene y Seguridad o del contrato respectivo, sin perjuicio de la
responsabilidad legal que corresponda. El acceso indebido o la difusión no autorizada de
datos puede además configurar delitos de la <strong>Ley 21.459</strong> (delitos
informáticos).</p>

<h2>6. Vigencia y revisión</h2>
<p>Esta política rige desde su fecha de aprobación y se revisa al menos <strong>una vez al
año</strong>, y además cada vez que cambien los sistemas, los riesgos o la normativa
aplicable. Toda modificación se comunica al personal dejando constancia de su recepción.</p>

<p style="margin-top:28px"><em>Documento tipo generado por DPC — Data Protection Compliance
como base estándar; debe completarse en los espacios en blanco y revisarse frente a la
operación real de la empresa antes de su aprobación.</em></p>`;
  },
};
