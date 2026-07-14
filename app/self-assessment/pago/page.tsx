import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PublicTopbar } from "@/components/self-assessment/public-topbar";
import { buttonClasses } from "@/components/ui";
import { getStripe, StripeError } from "@/lib/stripe/client";

/**
 * Retorno del Checkout de Stripe del diagnóstico público. Es solo informativa:
 * el estado real de pago lo fija el webhook verificado por firma
 * (app/api/stripe/webhook), NO este redirect (manipulable por el navegador).
 * Aun así, para no mostrar "pagado" en falso, se consulta a Stripe el
 * payment_status de la sesión antes de felicitar. No se indexa.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };

type SearchParams = Promise<{ status?: string; session_id?: string }>;

/** Consulta a Stripe si la sesión quedó efectivamente pagada. */
async function isSessionPaid(sessionId: string | undefined): Promise<boolean> {
  if (!sessionId) return false;
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    return session.payment_status === "paid";
  } catch (cause) {
    if (!(cause instanceof StripeError)) {
      console.warn("[pago] retrieve de sesión falló:", cause);
    }
    return false;
  }
}

export default async function PagoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { status, session_id } = await searchParams;
  const [t, tCommon, tSA] = await Promise.all([
    getTranslations("diagnosis.pay"),
    getTranslations("common"),
    getTranslations("selfAssessment"),
  ]);

  const paid = status === "success" ? await isSessionPaid(session_id) : false;
  const state: "success" | "processing" | "cancel" =
    status === "success" ? (paid ? "success" : "processing") : "cancel";

  const title =
    state === "success"
      ? t("successTitle")
      : state === "processing"
        ? t("processingTitle")
        : t("cancelTitle");
  const text =
    state === "success"
      ? t("successText")
      : state === "processing"
        ? t("processingText")
        : t("cancelText");

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#fbfbfc]">
      <PublicTopbar
        logoAlt={`${tCommon("appName")} — ${tCommon("appFullName")}`}
        tagline={tCommon("tagline")}
        backLabel={tSA("topbar.backToSite")}
      />
      <main
        id="main"
        className="mx-auto flex w-full max-w-[560px] flex-1 flex-col items-center justify-center px-32 py-80 text-center max-sm:px-16"
      >
        <div
          className={
            state === "cancel"
              ? "mx-auto flex h-48 w-48 items-center justify-center rounded-full bg-ash text-carbon"
              : "mx-auto flex h-48 w-48 items-center justify-center rounded-full bg-ink text-white"
          }
          aria-hidden="true"
        >
          {state === "success" ? (
            <svg
              width={22}
              height={22}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : state === "processing" ? (
            <svg
              width={22}
              height={22}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 6v6l4 2" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          ) : (
            <svg
              width={22}
              height={22}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          )}
        </div>

        <h1 className="mt-20 font-serif text-heading-sm font-medium tracking-[-0.5px] text-ink">
          {title}
        </h1>
        <p className="mx-auto mt-12 max-w-[46ch] text-body leading-[1.55] text-carbon">
          {text}
        </p>

        <div className="mt-24 flex flex-wrap items-center justify-center gap-12">
          {state === "cancel" ? (
            <Link href="/self-assessment" className={buttonClasses("primary")}>
              {t("backToDiagnosis")}
            </Link>
          ) : (
            <Link href="/" className={buttonClasses("primary")}>
              {t("backToSite")}
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
