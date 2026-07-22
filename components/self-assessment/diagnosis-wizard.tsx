"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { DiagnosisQuestionnaire } from "./diagnosis-questionnaire";
import { DiagnosisResultPanel } from "./diagnosis-result";

/**
 * Autodiagnóstico de cumplimiento (Ley 21.719) en un solo flujo: al abrir se
 * entra directo a la primera pregunta (delegada a `DiagnosisQuestionnaire`).
 * Al completarse, muestra el diagnóstico + propuesta de mitigación como
 * entregable. No hay registro ni pago: si el cliente quiere apoyo para
 * implementar la propuesta, el CTA lo lleva a WhatsApp.
 */
export function DiagnosisWizard() {
  const t = useTranslations("diagnosis");

  return (
    <DiagnosisQuestionnaire
      renderComplete={({ result, restart }) => (
        <>
          <DiagnosisResultPanel result={result} />
          <div className="mt-32 text-center print:hidden">
            <Button variant="ghost" onClick={restart}>
              {t("nav.restart")}
            </Button>
          </div>
        </>
      )}
    />
  );
}
