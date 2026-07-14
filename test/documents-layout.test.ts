import { describe, expect, it } from "vitest";
import { escapeHtml, renderDocument } from "../lib/documents/layout";

describe("escapeHtml", () => {
  it("escapa los caracteres peligrosos", () => {
    expect(escapeHtml(`<b>"a" & 'b'</b>`)).toBe(
      "&lt;b&gt;&quot;a&quot; &amp; &#39;b&#39;&lt;/b&gt;",
    );
  });
});

describe("renderDocument", () => {
  const base = {
    title: "Informe de diagnóstico",
    brand: "DPC · Data Protection Compliance",
    bodyHtml: "<p>cuerpo</p>",
    meta: { generated: "Generado el 14 de julio de 2026", folio: "76.086.428-5" },
  };

  it("produce un documento HTML autocontenido con título y cuerpo", () => {
    const html = renderDocument(base);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<style>");
    expect(html).toContain("Informe de diagnóstico");
    expect(html).toContain("<p>cuerpo</p>");
    expect(html).toContain("Generado el 14 de julio de 2026");
  });

  it("omite el bloque de verificación cuando no hay código/QR", () => {
    const html = renderDocument(base);
    expect(html).not.toContain("data:image/png;base64");
    expect(html).not.toContain('<div class="doc-verify"');
  });

  it("incluye el bloque código+QR cuando se entregan", () => {
    const html = renderDocument({
      ...base,
      code: "DPC-CA-2026-X7K4QZ",
      qrDataUri: "data:image/png;base64,AAAA",
      verifyLabel: "Documento verificable en línea",
    });
    expect(html).toContain('<div class="doc-verify"');
    expect(html).toContain("DPC-CA-2026-X7K4QZ");
    expect(html).toContain("data:image/png;base64,AAAA");
    expect(html).toContain("Documento verificable en línea");
  });
});
