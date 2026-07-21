/**
 * Documentos tipo de mitigación (sub-proyecto #5): plantillas legales que el
 * cliente descarga en PDF, personalizadas con los datos de su empresa, para
 * ejecutar la mitigación de sus brechas con un estándar consistente.
 *
 * ⚠️ TODO EL TEXTO LEGAL DE LAS PLANTILLAS ES BORRADOR PENDIENTE DE REVISIÓN
 * LEGAL (mismo gate pre-deploy que breach-content.ts): debe validarlo el
 * abogado ANTES de exponerse a clientes — son documentos que las empresas
 * van a firmar.
 *
 * Convenciones de las plantillas:
 * - Prosa legal en español, en código (igual que breach-content.ts); los
 *   labels de UI van por i18n.
 * - `buildBodyHtml(vars)` es PURA y devuelve el HTML del cuerpo para
 *   `renderDocument` (lib/documents/layout.ts). Usa `escapeHtml` para toda
 *   variable interpolada.
 * - Los datos que la plataforma no conoce (nombres de personas, fechas de
 *   firma) van como línea en blanco `________` para completar al firmar —
 *   estándar de documento tipo.
 */

export interface TemplateVars {
  /** Razón social de la empresa (companies.name). */
  companyName: string;
  /** RUT de la empresa. */
  companyRut: string;
  /** Fecha de generación ya formateada (es-CL). */
  generatedDate: string;
}

export interface DocumentTemplate {
  /** Identificador estable (kebab-case); es el segmento de la URL de descarga. */
  id: string;
  /** Título del documento (aparece en la cabecera del PDF y en el portal). */
  title: string;
  /** Una línea: qué es y para qué sirve (se muestra en el portal). */
  summary: string;
  /** Códigos de brecha (B-XXX-NNN) que este documento ayuda a mitigar. */
  appliesTo: readonly string[];
  /** Cuerpo del documento (HTML para renderDocument). Función pura. */
  buildBodyHtml: (vars: TemplateVars) => string;
}

/** Línea en blanco para completar a mano al firmar. */
export const BLANK = "________________________";
