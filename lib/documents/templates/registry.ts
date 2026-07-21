/**
 * Registro de documentos tipo de mitigación (sub-proyecto #5). Fuente única
 * para la ruta de descarga y para la sección "Cómo se mitiga" del portal.
 * El test de consistencia (test/documents/templates.test.ts) verifica ids
 * únicos, appliesTo válidos y cobertura contra BREACH_MITIGATION.
 */

import type { DocumentTemplate } from "./types";
import { politicaPrivacidad } from "./politica-privacidad";
import { actaDesignacionResponsable } from "./acta-designacion-responsable";
import { ratRegistroTratamientos } from "./rat-registro-tratamientos";
import { formularioArco } from "./formulario-arco";
import { consentimientoMarketing } from "./consentimiento-marketing";
import { consentimientoDatosSensibles } from "./consentimiento-datos-sensibles";
import { politicaSeguridadAccesos } from "./politica-seguridad-accesos";
import { planRespuestaIncidentes } from "./plan-respuesta-incidentes";
import { clausulaEncargo } from "./clausula-encargo";
import { clausulasTransferenciaInternacional } from "./clausulas-transferencia-internacional";
import { acuerdoCesionDatos } from "./acuerdo-cesion-datos";
import { politicaRetencionBorrado } from "./politica-retencion-borrado";
import { avisoVideovigilancia } from "./aviso-videovigilancia";
import { anexoBiometria } from "./anexo-biometria";
import { politicaDatosLaborales } from "./politica-datos-laborales";
import { actaConfidencialidadCapacitacion } from "./acta-confidencialidad-capacitacion";
import { pautaEipd } from "./pauta-eipd";

export const DOCUMENT_TEMPLATES: readonly DocumentTemplate[] = [
  politicaPrivacidad,
  actaDesignacionResponsable,
  ratRegistroTratamientos,
  formularioArco,
  consentimientoMarketing,
  consentimientoDatosSensibles,
  politicaSeguridadAccesos,
  planRespuestaIncidentes,
  clausulaEncargo,
  clausulasTransferenciaInternacional,
  acuerdoCesionDatos,
  politicaRetencionBorrado,
  avisoVideovigilancia,
  anexoBiometria,
  politicaDatosLaborales,
  actaConfidencialidadCapacitacion,
  pautaEipd,
];

const BY_ID = new Map(DOCUMENT_TEMPLATES.map((t) => [t.id, t]));

export function getTemplate(id: string): DocumentTemplate | null {
  return BY_ID.get(id) ?? null;
}

/** Nombre de archivo de descarga: <template-id>-<rut-sin-puntos>.pdf */
export function templateFilename(templateId: string, rut: string): string {
  const cleanRut = rut.replace(/[^0-9kK-]/g, "").toLowerCase() || "empresa";
  return `${templateId}-${cleanRut}.pdf`;
}
