/**
 * Construcción de enlaces wa.me para los CTA de WhatsApp de la cara pública.
 * El número sale de NEXT_PUBLIC_WHATSAPP_NUMBER (inlined en build por Next).
 */

// Fallback del prototipo -- pendiente número real
const FALLBACK_WHATSAPP_NUMBER = "56900000000";

// Aviso único a nivel módulo (solo servidor): en producción sin número real,
// todos los CTAs de WhatsApp quedan apuntando al placeholder del prototipo.
if (
  typeof window === "undefined" &&
  process.env.NODE_ENV === "production" &&
  !process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
) {
  console.warn(
    "[whatsapp] NEXT_PUBLIC_WHATSAPP_NUMBER no está definido: los CTAs de " +
      `WhatsApp apuntan al número placeholder ${FALLBACK_WHATSAPP_NUMBER}.`,
  );
}

/** URL de WhatsApp con mensaje prellenado (los mensajes viven en es.json). */
export function whatsappUrl(message: string): string {
  const number =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || FALLBACK_WHATSAPP_NUMBER;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
