/**
 * Mapa brecha → mitigación (sub-proyecto #5): por cada brecha del catálogo,
 * los pasos de mitigación en lenguaje llano, los documentos tipo que la
 * resuelven (lib/documents/templates) y el control DPC asociado para
 * trazabilidad al marco de trabajo.
 *
 * ⚠️ BORRADOR PENDIENTE DE REVISIÓN LEGAL/CONSULTOR (mismo gate que
 * breach-content.ts y remediation-map.ts): los pasos deben validarse antes
 * de producción.
 *
 * Los `templateIds` referencian ids del registro de documentos tipo
 * (lib/documents/templates/registry.ts); el test de consistencia verifica
 * que toda brecha tenga entrada y que todo id exista.
 */

export interface BreachMitigation {
  /** Pasos de mitigación, en orden sugerido, en lenguaje de dueño de pyme. */
  steps: readonly string[];
  /** Ids de documentos tipo que ayudan a ejecutar la mitigación. */
  templateIds: readonly string[];
  /** Control del marco DPC al que queda trazada la mitigación. */
  controlCode: string;
}

export const BREACH_MITIGATION: Record<string, BreachMitigation> = {
  "B-GOB-001": {
    steps: [
      "Completar la política de tratamiento de datos con la realidad de la empresa (qué datos, para qué, quién accede).",
      "Publicarla en el sitio web y/o dejarla disponible impresa en el local.",
      "Referenciarla en cada punto donde se recolectan datos (formularios, boletas, contratos).",
    ],
    templateIds: ["politica-privacidad"],
    controlCode: "DPC-TRA-001",
  },
  "B-GOB-002": {
    steps: [
      "Elegir a la persona que asumirá el rol de responsable de protección de datos.",
      "Formalizar la designación por escrito con el acta de designación y comunicarla al equipo.",
      "Incluir el nombre y canal de contacto del responsable en la política de privacidad.",
    ],
    templateIds: ["acta-designacion-responsable"],
    controlCode: "DPC-RES-001",
  },
  "B-INV-001": {
    steps: [
      "Levantar el inventario: recorrer cada proceso que usa datos personales (ventas, remuneraciones, marketing) y registrarlo en el RAT.",
      "Identificar para cada actividad la base de licitud, los destinatarios y el plazo de conservación.",
      "Definir un responsable y una revisión periódica (al menos anual) del registro.",
    ],
    templateIds: ["rat-registro-tratamientos"],
    controlCode: "DPC-INV-001",
  },
  "B-LEG-001": {
    steps: [
      "Dejar de enviar marketing a contactos sin consentimiento acreditable.",
      "Recabar el consentimiento con el formulario tipo (casilla no pre-marcada, canales elegidos por el titular) y registrarlo.",
      "Incluir en cada envío una vía simple de desuscripción y respetarla de inmediato.",
    ],
    templateIds: ["consentimiento-marketing"],
    controlCode: "DPC-LIC-001",
  },
  "B-LEG-002": {
    steps: [
      "Identificar qué datos sensibles se tratan y con qué finalidad.",
      "Obtener el consentimiento expreso y por escrito de cada titular con el formulario tipo.",
      "Guardar los consentimientos firmados de forma que puedan acreditarse ante la autoridad.",
    ],
    templateIds: ["consentimiento-datos-sensibles"],
    controlCode: "DPC-LIC-001",
  },
  "B-LEG-003": {
    steps: [
      "Separar las bases de datos por finalidad (operación vs. marketing).",
      "Usar para marketing solo los contactos con consentimiento específico para ese fin.",
      "Declarar cada finalidad en la política de privacidad y en el punto de recolección.",
    ],
    templateIds: ["consentimiento-marketing", "politica-privacidad"],
    controlCode: "DPC-FIN-001",
  },
  "B-SEG-001": {
    steps: [
      "Mover los datos de planillas y equipos locales a un repositorio con acceso controlado.",
      "Crear cuentas individuales con permisos según función y eliminar usuarios compartidos.",
      "Adoptar la política de seguridad tipo y capacitar al equipo en sus reglas.",
    ],
    templateIds: ["politica-seguridad-accesos"],
    controlCode: "DPC-SEG-001",
  },
  "B-SEG-002": {
    steps: [
      "Migrar los datos de la empresa desde cuentas personales (Gmail/Hotmail) a una cuenta empresarial (Workspace / Microsoft 365 Business).",
      "Activar verificación en dos pasos y cifrado en los dispositivos que acceden.",
      "Prohibir por política el uso de cuentas personales para datos de la empresa.",
    ],
    templateIds: ["politica-seguridad-accesos"],
    controlCode: "DPC-SEG-002",
  },
  "B-SEG-003": {
    steps: [
      "Adoptar el plan de respuesta tipo: roles, contactos y fases de contención/notificación.",
      "Difundirlo al equipo: todos deben saber a quién avisar ante una filtración.",
      "Hacer un simulacro simple al menos una vez al año.",
    ],
    templateIds: ["plan-respuesta-incidentes"],
    controlCode: "DPC-INC-001",
  },
  "B-INC-001": {
    steps: [
      "Abrir el registro de incidentes y documentar los incidentes pasados conocidos.",
      "Evaluar si algún incidente pasado exigía notificación y regularizar con asesoría.",
      "Registrar todo incidente futuro apenas se detecte, aunque parezca menor.",
    ],
    templateIds: ["plan-respuesta-incidentes"],
    controlCode: "DPC-INC-002",
  },
  "B-TER-001": {
    steps: [
      "Inventariar los proveedores que acceden a datos personales (contador, software, hosting).",
      "Firmar con cada uno la cláusula de encargo tipo (o anexarla al contrato vigente).",
      "Exigir en la cláusula la notificación de brechas y el destino de los datos al término.",
    ],
    templateIds: ["clausula-encargo"],
    controlCode: "DPC-TER-001",
  },
  "B-CON-002": {
    steps: [
      "Firmar la cláusula de encargo con el estudio contable u otro proveedor que procese datos de trabajadores.",
      "Acordar confidencialidad expresa sobre remuneraciones y antecedentes laborales.",
    ],
    templateIds: ["clausula-encargo"],
    controlCode: "DPC-TER-001",
  },
  "B-ENC-001": {
    steps: [
      "Formalizar con cada cliente cuya información se trata un contrato de encargo (rol de encargada).",
      "Regular la subcontratación: solo con autorización previa y por escrito del cliente.",
      "Definir la devolución o eliminación de los datos al terminar cada servicio.",
    ],
    templateIds: ["clausula-encargo"],
    controlCode: "DPC-TER-001",
  },
  "B-TER-002": {
    steps: [
      "Inventariar qué servicios almacenan datos fuera de Chile y en qué país.",
      "Anexar las cláusulas de transferencia internacional a los contratos con esos proveedores.",
      "Informar la transferencia y su destino en la política de privacidad.",
    ],
    templateIds: ["clausulas-transferencia-internacional", "politica-privacidad"],
    controlCode: "DPC-TER-002",
  },
  "B-CES-001": {
    steps: [
      "Suspender el intercambio de bases con otras empresas mientras no exista base legal.",
      "Firmar el acuerdo de cesión con cada empresa receptora, con finalidad específica.",
      "Informar la cesión a los titulares y recabar su consentimiento cuando corresponda.",
    ],
    templateIds: ["acuerdo-cesion-datos"],
    controlCode: "DPC-LIC-001",
  },
  "B-DER-001": {
    steps: [
      "Definir el canal único para solicitudes de derechos (correo o formulario) y publicarlo.",
      "Adoptar el formulario ARCOP tipo y registrar cada solicitud con su fecha.",
      "Responder dentro de 30 días corridos y dejar constancia de la respuesta.",
    ],
    templateIds: ["formulario-arco", "politica-privacidad"],
    controlCode: "DPC-DER-001",
  },
  "B-SAL-001": {
    steps: [
      "Restringir el acceso a fichas y datos de salud solo al personal que atiende al paciente.",
      "Migrar los registros clínicos a un sistema con acceso por perfiles y registro de accesos.",
      "Asegurar la conservación por el plazo legal (15 años) y el consentimiento expreso cuando corresponda.",
    ],
    templateIds: ["politica-seguridad-accesos", "consentimiento-datos-sensibles"],
    controlCode: "DPC-SEN-001",
  },
  "B-MEN-001": {
    steps: [
      "Identificar qué datos de menores de 14 años se tratan y con qué finalidad.",
      "Obtener la autorización del padre, madre o representante legal con el formulario tipo.",
      "Aplicar protección reforzada (acceso restringido, mínima retención) a estos datos.",
    ],
    templateIds: ["consentimiento-datos-sensibles"],
    controlCode: "DPC-SEN-001",
  },
  "B-BIO-001": {
    steps: [
      "Informar por escrito a cada trabajador el sistema biométrico, su finalidad y conservación con el anexo tipo.",
      "Ofrecer una alternativa no biométrica (tarjeta o PIN) sin consecuencias para quien la prefiera.",
      "Almacenar solo plantillas cifradas (hash) y eliminarlas al término de la relación laboral.",
    ],
    templateIds: ["anexo-biometria"],
    controlCode: "DPC-SEN-001",
  },
  "B-CCT-001": {
    steps: [
      "Instalar el cartel de aviso en todos los accesos y zonas con cámaras.",
      "Retirar o reorientar cualquier cámara que apunte a baños, vestidores o comedores.",
      "Fijar la retención máxima en 30 días y restringir quién puede ver las grabaciones.",
    ],
    templateIds: ["aviso-videovigilancia"],
    controlCode: "DPC-SEG-001",
  },
  "B-CON-001": {
    steps: [
      "Definir plazos de conservación por categoría de datos con la política tipo.",
      "Eliminar de forma segura los datos que ya cumplieron su finalidad o plazo legal.",
      "Programar una limpieza periódica (al menos anual) con responsable asignado.",
    ],
    templateIds: ["politica-retencion-borrado"],
    controlCode: "DPC-FIN-002",
  },
  "B-WEB-001": {
    steps: [
      "Publicar la política de privacidad en el sitio y enlazarla junto a cada formulario.",
      "Agregar el aviso de finalidad en el punto de recolección (antes de enviar el formulario).",
      "Implementar un banner de cookies con opción real de aceptar o rechazar.",
    ],
    templateIds: ["politica-privacidad"],
    controlCode: "DPC-TRA-001",
  },
  "B-CAP-001": {
    steps: [
      "Realizar una capacitación básica de protección de datos a todo el personal que los maneja.",
      "Firmar el acta de capacitación y compromiso de confidencialidad con cada trabajador.",
      "Incorporar el módulo de datos personales a la inducción de nuevos ingresos.",
    ],
    templateIds: ["acta-confidencialidad-capacitacion"],
    controlCode: "DPC-CON-001",
  },
  "B-LAB-001": {
    steps: [
      "Revisar los formularios de postulación y eliminar los campos innecesarios para el cargo.",
      "Adoptar la política de datos laborales con las reglas de selección.",
      "Eliminar los antecedentes de postulantes no seleccionados dentro del plazo definido.",
    ],
    templateIds: ["politica-datos-laborales"],
    controlCode: "DPC-PRO-001",
  },
  "B-LAB-002": {
    steps: [
      "Informar a los trabajadores qué datos suyos se manejan y quién accede, con la política tipo.",
      "Restringir el acceso a carpetas personales y remuneraciones solo a quienes lo necesitan.",
      "Regular por escrito cualquier monitoreo (correo, equipos, ubicación) y comunicarlo antes de aplicarlo.",
    ],
    templateIds: ["politica-datos-laborales"],
    controlCode: "DPC-CON-001",
  },
  "B-EIA-001": {
    steps: [
      "Informar a las personas afectadas que existe una decisión automatizada y su lógica general.",
      "Habilitar una vía simple para pedir revisión humana de la decisión.",
      "Documentar ambas cosas en la política de privacidad (sección de decisiones automatizadas).",
    ],
    templateIds: ["pauta-eipd", "politica-privacidad"],
    controlCode: "DPC-EIA-002",
  },
  "B-EIA-002": {
    steps: [
      "Realizar la evaluación de impacto con la pauta tipo antes de seguir operando el sistema.",
      "Aplicar las medidas de mitigación que la evaluación identifique.",
      "Repetir la evaluación ante cambios relevantes del sistema o de los datos tratados.",
    ],
    templateIds: ["pauta-eipd"],
    controlCode: "DPC-EIA-001",
  },
};

export function getBreachMitigation(breachCode: string): BreachMitigation | null {
  return BREACH_MITIGATION[breachCode] ?? null;
}
