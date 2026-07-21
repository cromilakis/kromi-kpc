import { Marked } from "marked";

/**
 * Renderizador de markdown → HTML para las propuestas de mitigación
 * (content/mitigations/*.md), authoreadas por el equipo para mantención
 * simple y servidas como PDF con el chrome de documentos (layout.ts).
 *
 * Instancia propia de Marked (sin estado global): GFM para tablas y listas,
 * sin `mangle`/`headerIds` (irrelevantes para PDF). El HTML resultante lo
 * sanea el propio pipeline de marked; el markdown es de fuente confiable
 * (archivos del repo, no entrada de usuario).
 */
const marked = new Marked({ gfm: true, breaks: false });

/**
 * Convierte el cuerpo markdown de una propuesta a HTML para `renderDocument`.
 * El front-matter simple (líneas `key: value` antes de una línea en blanco,
 * delimitado por `---`) se descarta: el título va por la cabecera del doc.
 */
export function markdownToHtml(md: string): string {
  const body = stripFrontMatter(md);
  return marked.parse(body, { async: false }) as string;
}

/** Extrae el título del front-matter `title:` si existe. */
export function markdownTitle(md: string): string | null {
  const match = /^---\s*\n([\s\S]*?)\n---/.exec(md);
  if (!match) return null;
  const titleLine = match[1]
    .split("\n")
    .find((line) => line.trim().toLowerCase().startsWith("title:"));
  if (!titleLine) return null;
  return titleLine.slice(titleLine.indexOf(":") + 1).trim().replace(/^["']|["']$/g, "") || null;
}

function stripFrontMatter(md: string): string {
  return md.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, "");
}
