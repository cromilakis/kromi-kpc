import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { PublicTopbar } from "@/components/self-assessment/public-topbar";
import { DiagnosisWizard } from "@/components/self-assessment/diagnosis-wizard";
import type { WizardSector } from "@/components/companies/new-company-wizard";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Catálogo de rubros de respaldo (espejo del seed): garantiza que el formulario
 * del lead funcione aunque el catálogo de la base no esté disponible. El código
 * es la fuente de verdad para el consultor; acá solo se usan code + name.
 */
const FALLBACK_SECTORS: WizardSector[] = [
  { code: "otro", name: "Otro / General", laws: [] },
  { code: "retail", name: "Retail / e-commerce", laws: [] },
  { code: "fintech", name: "Fintech / Financiero", laws: [] },
  { code: "salud", name: "Salud", laws: [] },
  { code: "b2b", name: "Servicios B2B", laws: [] },
  { code: "telco", name: "Telecomunicaciones", laws: [] },
  { code: "startup", name: "Startup tecnológica", laws: [] },
  { code: "estado", name: "Proveedor del Estado", laws: [] },
];

/**
 * /self-assessment — diagnóstico gratuito de cumplimiento en protección de
 * datos personales (Ley 21.719). Sin registro, sin compromiso. 15 preguntas
 * de screening que entregan un resumen de brechas detectadas y una
 * estimación del riesgo de multas.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("selfAssessment.meta");
  return { title: t("title"), description: t("description") };
}

export default async function SelfAssessmentPage() {
  const [locale, messages, t, tCommon, tDiag] = await Promise.all([
    getLocale(),
    getMessages(),
    getTranslations("selfAssessment"),
    getTranslations("common"),
    getTranslations("diagnosis"),
  ]);

  // Catálogo de rubros para el formulario del lead (paso "Obtener el
  // diagnóstico completo"). anon no tiene acceso directo a catálogos (RLS), por
  // eso se lee vía service role; solo se exponen code/name/laws (el
  // multiplicador de complejidad es server-only y no viaja al cliente).
  let sectors: WizardSector[] = [];
  try {
    const { data, error } = await createAdminClient()
      .from("sectors")
      .select("code, name, laws")
      .order("sort", { ascending: true });
    if (error) {
      // Degradación controlada: el formulario del lead queda sin catálogo de
      // rubros, pero la autoevaluación sigue. warn (no error) para no disparar
      // el overlay de dev cuando Supabase no está disponible (p. ej. local caído).
      console.warn("[self-assessment] catálogo de rubros:", error.message);
    } else {
      sectors = data ?? [];
    }
  } catch (cause) {
    console.warn("[self-assessment] catálogo de rubros no disponible:", cause);
  }
  // Sin catálogo (BD no disponible) → respaldo, para que el formulario funcione.
  if (sectors.length === 0) sectors = FALLBACK_SECTORS;

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#fbfbfc]">
      <PublicTopbar
        logoAlt={`${tCommon("appName")} — ${tCommon("appFullName")}`}
        tagline={tCommon("tagline")}
        backLabel={t("topbar.backToSite")}
      />
      <main
        id="main"
        className="mx-auto w-full max-w-[1080px] flex-1 px-32 pb-80 pt-[56px] max-sm:px-16 max-sm:pt-32"
      >
        <header className="mb-40 text-center max-sm:mb-28">
          <h1 className="mx-auto max-w-[720px] font-serif text-[40px] font-medium leading-[1.1] tracking-[-0.7px] text-ink max-sm:text-[30px]">
            {tDiag("splash.title")}
          </h1>
          <p className="mx-auto mt-16 max-w-[600px] text-[17px] leading-[1.5] text-metal">
            {tDiag("splash.subtitle")}
          </p>
        </header>

        <NextIntlClientProvider
          locale={locale}
          messages={{
            selfAssessment: messages.selfAssessment,
            diagnosis: messages.diagnosis,
            common: messages.common,
          }}
        >
          <DiagnosisWizard sectors={sectors} />
        </NextIntlClientProvider>
      </main>
    </div>
  );
}
