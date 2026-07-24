import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AgenciesCloud } from "@/components/landing/agencies-cloud";
import { CtaBand } from "@/components/landing/cta-band";
import { CycleSection } from "@/components/landing/cycle-section";
import { DomainsSection } from "@/components/landing/domains-section";
import { FaqSection } from "@/components/landing/faq-section";
import { ForkSection } from "@/components/landing/fork-section";
import { Hero } from "@/components/landing/hero";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingNav } from "@/components/landing/landing-nav";
import { LegalContextSection } from "@/components/landing/legal-context-section";
import { ManifestoSection } from "@/components/landing/manifesto-section";
import { RecognitionSection } from "@/components/landing/recognition-section";
import { ReportSection } from "@/components/landing/report-section";
import { SmoothScrollProvider } from "@/components/landing/smooth-scroll-provider";
import { WhatsAppFab } from "@/components/landing/whatsapp-fab";

/**
 * Landing pública KPC — orden narrativo de positioning.md §7 (reposicionamiento
 * 2026-07-24): generosidad primero, miedo después. El informe es el protagonista
 * y el manifiesto declara la postura antes de cualquier detalle de producto:
 *
 *   nav → hero (el regalo) → manifiesto (la postura) → el informe (entregable) →
 *   ¿alguna te suena? (espejo) → el estándar (14 dominios + organismos) →
 *   contexto legal (sanciones, reencuadrado) → cómo funciona → la bifurcación
 *   (implementación) → FAQ → CTA final → footer. La diferenciación es implícita
 *   (manifiesto + informe + bifurcación), no una sección comparativa.
 *
 * Todo server components; los textos salen de messages/es.json (next-intl).
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// Claves del FAQ (messages/es.json → landing.faq.items) para el JSON-LD FAQPage,
// que habilita el resultado enriquecido de preguntas frecuentes en Google.
const FAQ_KEYS = [
  "obligation",
  "duration",
  "cost",
  "skills",
  "deliverable",
  "whyFree",
  "privacy",
];

async function FaqStructuredData() {
  const t = await getTranslations("landing.faq.items");
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_KEYS.map((key) => ({
      "@type": "Question",
      name: t(`${key}.q`),
      acceptedAnswer: { "@type": "Answer", text: t(`${key}.a`) },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function LandingPage() {
  return (
    <SmoothScrollProvider>
      <FaqStructuredData />
      <div className="flex min-h-full flex-1 flex-col overflow-x-clip bg-white">
        <LandingNav />
        <main id="main" className="flex-1">
          <Hero />
          <ManifestoSection />
          <ReportSection />
          <RecognitionSection />
          <DomainsSection />
          <AgenciesCloud />
          <LegalContextSection />
          <CycleSection />
          <ForkSection />
          <FaqSection />
          <CtaBand />
        </main>
        <LandingFooter />
        <WhatsAppFab />
      </div>
    </SmoothScrollProvider>
  );
}
