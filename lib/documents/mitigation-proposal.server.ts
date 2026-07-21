import "server-only";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Acceso a las propuestas de mitigación authoreadas en markdown
 * (content/mitigations/<breach-code>.md). Los archivos se tracean en el
 * server bundle vía outputFileTracingIncludes (next.config.ts).
 *
 * Solo se aceptan códigos de brecha con la forma B-XXX-NNN para no permitir
 * path traversal en el nombre de archivo.
 */

const CODE_PATTERN = /^B-[A-Z]{2,4}-\d{3}$/;

function proposalPath(breachCode: string): string | null {
  if (!CODE_PATTERN.test(breachCode)) return null;
  return path.join(process.cwd(), "content", "mitigations", `${breachCode}.md`);
}

/** ¿Existe una propuesta de mitigación para esta brecha? */
export function proposalExists(breachCode: string): boolean {
  const file = proposalPath(breachCode);
  return file ? existsSync(file) : false;
}

/** Lee el markdown de la propuesta, o null si no existe. */
export async function loadProposalMarkdown(breachCode: string): Promise<string | null> {
  const file = proposalPath(breachCode);
  if (!file || !existsSync(file)) return null;
  try {
    return await readFile(file, "utf8");
  } catch {
    return null;
  }
}
