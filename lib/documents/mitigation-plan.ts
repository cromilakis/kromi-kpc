import { escapeHtml } from "./layout";
import type { ReportData } from "./report-http";
import { getTemplate } from "./templates/registry";
import { getBreachMitigation } from "@/lib/legal/breach-mitigation";

/**
 * Plan de mitigación consolidado (sub-proyecto #5): un solo PDF con todas las
 * brechas del diagnóstico activo, sus pasos de mitigación y los documentos
 * tipo asociados. Constructor puro (mismo patrón que diagnosis-report.ts);
 * el contenido de pasos viene de BREACH_MITIGATION (borrador pendiente de
 * revisión legal).
 */

export interface MitigationDict {
  title: string;
  intro: string;
  severityLabels: Record<string, string>;
  stepsTitle: string;
  documentsTitle: string;
  empty: string;
  footerNote: string;
}

export function buildMitigationPlanHtml(data: ReportData, dict: MitigationDict): string {
  if (data.breaches.length === 0) {
    return `<p class="doc-empty">${escapeHtml(dict.empty)}</p>`;
  }

  const sections = data.breaches
    .map((breach, index) => {
      const mitigation = getBreachMitigation(breach.breachCode);
      if (!mitigation) return "";

      const severity = dict.severityLabels[breach.severity] ?? breach.severity;
      const steps = mitigation.steps
        .map((step) => `<li>${escapeHtml(step)}</li>`)
        .join("");
      const documents = mitigation.templateIds
        .map((id) => getTemplate(id))
        .filter((template) => template !== null)
        .map((template) => `<li>${escapeHtml(template.title)}</li>`)
        .join("");

      return `
<h2>${index + 1}. ${escapeHtml(breach.areaLabel)} · <span class="sev sev-${escapeHtml(breach.severity)}">${escapeHtml(severity)}</span></h2>
<p>${escapeHtml(breach.description)}</p>
<p><strong>${escapeHtml(dict.stepsTitle)}</strong></p>
<ol>${steps}</ol>
${documents ? `<p><strong>${escapeHtml(dict.documentsTitle)}</strong></p><ul>${documents}</ul>` : ""}`;
    })
    .join("");

  return `
<p>${escapeHtml(dict.intro)}</p>
${sections}
<div class="doc-footer">${escapeHtml(dict.footerNote)}</div>`;
}
