/**
 * Clases compartidas de los controles de formulario — Style Reference Attio
 * (§Components "Text Input") + prototipo §3.6 "Input":
 * 14px Inter, borde 1px Slate, radius 7px (rounded-inputs), padding 9px 12px,
 * placeholder Overcast (el Lead del prototipo no alcanzaba contraste AA),
 * focus glow Focus Blue al 40% (Elevation "Input Focus").
 * Interno del kit: no se exporta en el barrel.
 */
export const formControlClasses =
  "block w-full rounded-inputs border border-slate bg-white px-12 py-[9px] " +
  "text-body-sm leading-body-sm tracking-body-sm text-ink " +
  "placeholder:text-overcast " +
  "focus:border-focus-blue focus:outline-none focus:ring-[3px] focus:ring-focus-blue/40 " +
  "disabled:bg-ash disabled:text-lead " +
  "aria-invalid:border-danger-red";
