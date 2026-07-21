/**
 * Chrome compartido de los documentos PDF: cabecera de marca, cuerpo, pie con
 * fecha de generación y folio, y un bloque OPCIONAL de código + QR (para el
 * certificado, #7). Devuelve HTML autocontenido con CSS inline (no depende del
 * pipeline Tailwind de la app); Chromium lo imprime a PDF. Función pura.
 */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface DocumentMeta {
  /** Texto ya formateado, p. ej. "Generado el 14 de julio de 2026". */
  generated: string;
  /** Folio/identificador corto opcional (p. ej. RUT). */
  folio?: string;
}

export interface DocumentChrome {
  title: string;
  brand: string;
  /** HTML del cuerpo, ya escapado por el constructor del documento. */
  bodyHtml: string;
  meta: DocumentMeta;
  /** Código verificable opcional (para #7). */
  code?: string;
  /** Data URI del QR opcional (para #7). */
  qrDataUri?: string;
  /** Etiqueta del bloque de verificación (i18n). */
  verifyLabel?: string;
}

const STYLES = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: Georgia, "Times New Roman", serif;
    color: #1b1f24;
    font-size: 12px;
    line-height: 1.5;
  }
  .doc { padding: 48px 44px; }
  .doc-header {
    display: flex; justify-content: space-between; align-items: baseline;
    border-bottom: 2px solid #1b1f24; padding-bottom: 14px; margin-bottom: 28px;
  }
  .doc-brand { font-size: 11px; letter-spacing: 0.4px; color: #5b6570; text-transform: uppercase; }
  .doc-title { font-size: 22px; font-weight: 600; margin: 0 0 4px; }
  .doc-meta { font-size: 10px; color: #5b6570; text-align: right; }
  .doc-body h1 { font-size: 18px; font-weight: 600; margin: 26px 0 10px; }
  .doc-body h2 { font-size: 14px; font-weight: 600; margin: 24px 0 10px; }
  .doc-body h3 { font-size: 12px; font-weight: 700; margin: 18px 0 6px; text-transform: uppercase; letter-spacing: 0.3px; color: #5b6570; }
  .doc-body p { margin: 0 0 10px; }
  .doc-body ul, .doc-body ol { margin: 0 0 12px; padding-left: 20px; }
  .doc-body li { margin: 0 0 5px; }
  .doc-body a { color: #1b1f24; text-decoration: underline; }
  .doc-body strong { font-weight: 700; }
  .doc-body blockquote { margin: 0 0 12px; padding: 8px 14px; border-left: 3px solid #1b1f24; background: #f6f7f8; font-style: italic; }
  .doc-body hr { border: none; border-top: 1px solid #e3e6ea; margin: 20px 0; }
  .doc-body code { font-family: "Courier New", monospace; font-size: 11px; background: #f3f4f6; padding: 1px 4px; border-radius: 3px; }
  .doc-summary { display: flex; gap: 28px; margin-bottom: 8px; }
  .doc-summary .item { }
  .doc-summary .label { font-size: 10px; color: #5b6570; text-transform: uppercase; letter-spacing: 0.4px; }
  .doc-summary .value { font-size: 16px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e3e6ea; vertical-align: top; }
  th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.4px; color: #5b6570; font-weight: 600; }
  .sev { font-weight: 600; }
  .sev-critico { color: #772322; }
  .sev-alto { color: #705500; }
  .sev-medio, .sev-bajo { color: #5b6570; }
  .doc-empty { color: #5b6570; font-style: italic; }
  .doc-verify {
    display: flex; align-items: center; gap: 16px;
    margin-top: 32px; padding-top: 16px; border-top: 1px solid #e3e6ea;
  }
  .doc-verify img { width: 84px; height: 84px; }
  .doc-verify .code { font-family: "Courier New", monospace; font-size: 13px; font-weight: 700; }
  .doc-footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #e3e6ea; font-size: 10px; color: #5b6570; }
`;

export function renderDocument(chrome: DocumentChrome): string {
  const { title, brand, bodyHtml, meta, code, qrDataUri, verifyLabel } = chrome;

  const verifyBlock =
    code && qrDataUri
      ? `<div class="doc-verify">
           <img src="${qrDataUri}" alt="" />
           <div>
             ${verifyLabel ? `<div>${escapeHtml(verifyLabel)}</div>` : ""}
             <div class="code">${escapeHtml(code)}</div>
           </div>
         </div>`
      : "";

  const folio = meta.folio
    ? `<div>${escapeHtml(meta.folio)}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<style>${STYLES}</style>
</head>
<body>
  <div class="doc">
    <div class="doc-header">
      <div>
        <div class="doc-brand">${escapeHtml(brand)}</div>
        <h1 class="doc-title">${escapeHtml(title)}</h1>
      </div>
      <div class="doc-meta">
        <div>${escapeHtml(meta.generated)}</div>
        ${folio}
      </div>
    </div>
    <div class="doc-body">${bodyHtml}</div>
    ${verifyBlock}
  </div>
</body>
</html>`;
}
