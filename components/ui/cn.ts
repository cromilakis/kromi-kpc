/**
 * Helper mínimo para componer clases condicionales sin dependencia externa.
 * Filtra valores falsy y une con espacio.
 */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}
