import "server-only";
import { buildDiagnosisReportHtml, type ReportDict } from "./diagnosis-report";
import { renderPdf } from "./render.server";
import { REPORT_ERROR_STATUS, reportFilename, type ReportResult } from "./report-http";

/**
 * Arma la Response del informe: estado de error → JSON + código HTTP; éxito →
 * HTML del informe → PDF → application/pdf con Content-Disposition. Un fallo de
 * render se degrada a 503 (nunca a un PDF vacío).
 */
export async function respondWithReportPdf(
  result: ReportResult,
  dict: ReportDict,
  generated: string,
): Promise<Response> {
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: REPORT_ERROR_STATUS[result.error] });
  }
  try {
    const html = buildDiagnosisReportHtml(result.data, dict, generated);
    const pdf = await renderPdf(html);
    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${reportFilename(result.data.rut)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (cause) {
    console.error("[documents] respondWithReportPdf: render falló:", cause);
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}
