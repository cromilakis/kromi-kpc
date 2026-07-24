import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonClasses } from "@/components/ui";
import { DocumentIcon } from "./icons";

/**
 * "¿ALGUNA TE SUENA?" — el espejo (positioning.md §5, pos. 5): seis preguntas
 * cotidianas de reconocimiento (espejo de los nodos S-006/S-007/S-009/S-010/
 * S-011/S-014 de la autoevaluación). El lector se ve reflejado y pasa de "esto
 * es abstracto" a "esto soy yo". Cierra reencuadrando en apoyo —cada situación
 * tiene un lugar en el informe, con solución— y en el CTA único. Extraída de la
 * antigua StakesSection (positioning.md §7). Nunca amenaza: reconoce.
 */
export async function RecognitionSection() {
  const t = await getTranslations("landing.recognition");

  return (
    <section
      id="reconoces"
      className="mx-auto w-full max-w-[1180px] scroll-mt-[64px] px-32 py-80 max-sm:px-16 max-sm:py-60"
    >
      <div className="rounded-xl border border-stone bg-haze px-32 py-40 max-sm:px-20">
        <p className="text-center text-caption font-semibold uppercase tracking-[0.4px] text-carbon">
          {t("label")}
        </p>
        <ul className="mx-auto mt-24 grid max-w-[880px] gap-x-32 gap-y-16 sm:grid-cols-2">
          {(t.raw("items") as string[]).map((question) => (
            <li key={question} className="flex gap-[10px]">
              <span
                aria-hidden
                className="mt-[7px] h-[6px] w-[6px] shrink-0 rounded-full bg-ink"
              />
              <span className="text-body-sm font-medium leading-[1.55] text-ink">
                {question}
              </span>
            </li>
          ))}
        </ul>
        <div className="mx-auto mt-32 max-w-[620px] text-center">
          <p className="mx-auto max-w-[560px] text-body-sm leading-[1.6] text-carbon">
            {t("closeLead")}{" "}
            <b className="font-semibold text-ink">{t("closeSupport")}</b>
          </p>
          <p className="mx-auto mt-16 max-w-[540px] text-subheading font-medium leading-[1.35] tracking-subheading text-ink">
            {t("question")}
          </p>
          <div className="mt-20 flex justify-center">
            <Link
              href="/self-assessment"
              className={buttonClasses("primary", "gap-[9px] px-[22px] py-[13px] text-body")}
            >
              <DocumentIcon className="shrink-0" />
              {t("cta")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
