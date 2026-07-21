import { getTranslations } from "next-intl/server";
import { renderDocument } from "@/lib/documents/layout";
import { buildMitigationPlanHtml, type MitigationDict } from "@/lib/documents/mitigation-plan";
import { loadClientReportData } from "@/lib/documents/load-report-data.server";
import { renderPdf } from "@/lib/documents/render.server";
import { REPORT_ERROR_STATUS } from "@/lib/documents/report-http";

/**
 * GET /portal/evaluaciones/plan-mitigacion — descarga el Plan de mitigación
 * consolidado del cliente (gated a pagado, RLS; mismo loader que el informe).
 * Se regenera on-demand.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(): Promise<Response> {
  const [result, t] = await Promise.all([
    loadClientReportData(),
    getTranslations("documents.mitigation"),
  ]);
  if (!result.ok) {
    return Response.json(
      { error: result.error },
      { status: REPORT_ERROR_STATUS[result.error] },
    );
  }

  const dict: MitigationDict = {
    title: t("title"),
    intro: t("intro"),
    severityLabels: t.raw("severityLabels") as Record<string, string>,
    objectiveLabel: t("objectiveLabel"),
    stepsTitle: t("stepsTitle"),
    evidenceLabel: t("evidenceLabel"),
    documentsTitle: t("documentsTitle"),
    empty: t("empty"),
    footerNote: t("footerNote"),
  };
  const generated = new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Santiago",
  }).format(new Date());

  try {
    const html = renderDocument({
      title: dict.title,
      brand: t("brand"),
      bodyHtml: buildMitigationPlanHtml(result.data, dict),
      meta: {
        generated: t("generatedLabel", { date: generated }),
        folio: result.data.rut || undefined,
      },
    });
    const pdf = await renderPdf(html);
    const safeRut = result.data.rut.replace(/[^0-9kK-]/g, "") || "empresa";
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="plan-mitigacion-${safeRut}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (cause) {
    console.error("[documents] render del plan de mitigación falló:", cause);
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}
