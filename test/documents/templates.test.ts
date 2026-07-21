import { describe, expect, it } from "vitest";
import { DOCUMENT_TEMPLATES, getTemplate, templateFilename } from "@/lib/documents/templates/registry";
import type { TemplateVars } from "@/lib/documents/templates/types";
import { BREACH_MITIGATION } from "@/lib/legal/breach-mitigation";
import { SCREENING_BREACHES } from "@/lib/legal/screening-nodes";

/**
 * Consistencia del sub-proyecto #5: el registro de documentos tipo, el mapa
 * brecha→mitigación y el catálogo de brechas deben calzar sin huecos — es lo
 * que garantiza que ninguna brecha quede sin propuesta de mitigación y que
 * ningún enlace de descarga apunte a una plantilla inexistente.
 */

const SAMPLE_VARS: TemplateVars = {
  companyName: "Empresa Ejemplo SpA & Cía. <test>",
  companyRut: "76.543.210-K",
  generatedDate: "21 de julio de 2026",
};

describe("registro de documentos tipo", () => {
  it("tiene ids únicos y en kebab-case", () => {
    const ids = DOCUMENT_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("cada plantilla aplica a brechas que existen en el catálogo", () => {
    for (const template of DOCUMENT_TEMPLATES) {
      expect(template.appliesTo.length).toBeGreaterThan(0);
      for (const code of template.appliesTo) {
        expect(SCREENING_BREACHES[code], `${template.id} → ${code}`).toBeDefined();
      }
    }
  });

  it("cada plantilla renderiza un cuerpo sustantivo con las variables escapadas", () => {
    for (const template of DOCUMENT_TEMPLATES) {
      const html = template.buildBodyHtml(SAMPLE_VARS);
      expect(html.length, template.id).toBeGreaterThan(500);
      // El nombre con & y < debe llegar escapado, nunca crudo.
      expect(html).toContain("Empresa Ejemplo SpA &amp; Cía. &lt;test&gt;");
      expect(html).not.toContain("SpA & Cía. <test>");
      expect(html).not.toContain("undefined");
      expect(html).toContain(SAMPLE_VARS.companyRut);
    }
  });

  it("getTemplate resuelve por id y rechaza desconocidos", () => {
    expect(getTemplate("politica-privacidad")?.title).toBeTruthy();
    expect(getTemplate("no-existe")).toBeNull();
  });

  it("templateFilename sanea el RUT", () => {
    expect(templateFilename("formulario-arco", "76.543.210-K")).toBe(
      "formulario-arco-76543210-k.pdf",
    );
    expect(templateFilename("formulario-arco", "")).toBe("formulario-arco-empresa.pdf");
  });
});

describe("mapa brecha → mitigación", () => {
  it("TODA brecha del catálogo tiene un plan concreto y trazable", () => {
    for (const code of Object.keys(SCREENING_BREACHES)) {
      const mitigation = BREACH_MITIGATION[code];
      expect(mitigation, `falta mitigación para ${code}`).toBeDefined();
      expect(mitigation!.objective.length, `${code}: objetivo`).toBeGreaterThan(40);
      expect(mitigation!.actions.length, `${code}: acciones`).toBeGreaterThanOrEqual(2);
      for (const action of mitigation!.actions) {
        expect(action.title.length, `${code}: título de acción`).toBeGreaterThan(5);
        expect(action.detail.length, `${code}: detalle de acción`).toBeGreaterThan(20);
        expect(action.evidence.length, `${code}: evidencia de acción`).toBeGreaterThan(10);
      }
      expect(["alta", "media", "baja"]).toContain(mitigation!.priority);
      expect(["bajo", "medio", "alto"]).toContain(mitigation!.effort);
      expect(mitigation!.estimatedWeeks, `${code}: plazo`).toBeGreaterThan(0);
      expect(mitigation!.controlCode, code).toMatch(/^DPC-[A-Z]{3}-\d{3}$/);
    }
  });

  it("no hay mitigaciones de brechas que no existen", () => {
    for (const code of Object.keys(BREACH_MITIGATION)) {
      expect(SCREENING_BREACHES[code], `mitigación huérfana: ${code}`).toBeDefined();
    }
  });

  it("todo templateId referenciado existe en el registro", () => {
    for (const [code, mitigation] of Object.entries(BREACH_MITIGATION)) {
      for (const id of mitigation.templateIds) {
        expect(getTemplate(id), `${code} → plantilla desconocida ${id}`).not.toBeNull();
      }
    }
  });

  it("toda plantilla del registro es usada por al menos una mitigación", () => {
    const used = new Set(
      Object.values(BREACH_MITIGATION).flatMap((m) => [...m.templateIds]),
    );
    for (const template of DOCUMENT_TEMPLATES) {
      expect(used.has(template.id), `plantilla sin uso: ${template.id}`).toBe(true);
    }
  });
});
