/**
 * Routing de re-certificación por tramo (Complexity Score interno).
 * Puro, sin I/O — no expone el score/tramo al cliente, solo el gate resultante.
 */

export type RecertGate = "self_service_pending" | "consultant_review";

export function recertGate(scoreTier: "low" | "medium" | "high" | "critical"): RecertGate {
  return scoreTier === "low" ? "self_service_pending" : "consultant_review";
}

/**
 * Versión del texto de consentimiento de re-certificación mostrado en el portal.
 * TODO-LEGAL: el texto real es un placeholder pendiente de revisión por abogado;
 * esta versión se registra en `audit_log` junto con el timestamp de aceptación.
 */
export const RECERT_CONSENT_VERSION = "v1-placeholder";
