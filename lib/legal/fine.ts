import { UTM_CLP } from "@/lib/legal";

/**
 * Formatea el rango de multa (en UTM del snapshot) a CLP legible: "$X – $Y".
 * Si min === max devuelve "$X"; si falta algún extremo devuelve null (la UI
 * omite la multa). Separador de miles es-CL.
 */
export function formatFineClp(
  minUtm: number | null,
  maxUtm: number | null,
): string | null {
  if (minUtm == null || maxUtm == null) return null;
  const min = Math.round(minUtm * UTM_CLP);
  const max = Math.round(maxUtm * UTM_CLP);
  const fmt = (n: number) => `$${n.toLocaleString("es-CL")}`;
  return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
}
