import { getTranslations } from "next-intl/server";
import { WhatsAppIcon } from "./icons";
import { whatsappUrl } from "./whatsapp";

/**
 * Botón flotante de WhatsApp: burbuja fija abajo a la derecha, visible en todo
 * el scroll, para tener el contacto siempre a mano sin ponerlo como CTA
 * comercial en el hero ni en el nav (positioning.md §6: no vender antes de dar).
 * Monocromo ink con el glifo de WhatsApp (regla de marca: sin verde #25D366; el
 * canal se señala solo con el ícono). Sombra sutil admitida por ser un elemento
 * flotante (no un botón inline). Server component: resuelve el aviso sr-only de
 * target="_blank" sin JS de cliente.
 */
export async function WhatsAppFab() {
  const t = await getTranslations("landing.whatsapp");
  const tCommon = await getTranslations("common");

  return (
    <a
      href={whatsappUrl(t("infoMessage"))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("fabLabel")}
      className="fixed bottom-24 right-24 z-40 inline-flex items-center gap-[10px] rounded-full border border-ink bg-ink py-[13px] pl-[16px] pr-[20px] text-body font-medium text-white shadow-subtle-3 transition-transform hover:scale-105 max-sm:bottom-16 max-sm:right-16"
    >
      <WhatsAppIcon size={22} className="shrink-0" />
      {t("fabText")}
      <span className="sr-only">{tCommon("opensInNewWindow")}</span>
    </a>
  );
}
