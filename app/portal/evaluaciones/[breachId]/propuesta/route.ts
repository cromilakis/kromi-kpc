import { getTranslations } from "next-intl/server";
import { renderDocument } from "@/lib/documents/layout";
import { markdownToHtml, markdownTitle } from "@/lib/documents/markdown";
import { loadProposalMarkdown } from "@/lib/documents/mitigation-proposal.server";
import { renderPdf } from "@/lib/documents/render.server";
import { loadClientTemplateVars } from "@/lib/documents/templates/load-template-vars.server";
import { REPORT_ERROR_STATUS } from "@/lib/documents/report-http";
import { loadClientBreach } from "@/lib/portal/load-diagnosis.server";

/**
 * GET /portal/evaluaciones/[breachId]/propuesta — descarga la propuesta de
 * mitigación en profundidad (authoreada en markdown) en PDF, personalizada
 * con los datos de la empresa. Gated a pagado (loadClientBreach + template
 * vars); regenerada on-demand.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Reemplaza tokens {{companyName}} / {{rut}} / {{date}} en el markdown. */
function fillTokens(
  md: string,
  vars: { companyName: string; companyRut: string; generatedDate: string },
): string {
  return md
    .replaceAll("{{companyName}}", vars.companyName)
    .replaceAll("{{rut}}", vars.companyRut)
    .replaceAll("{{date}}", vars.generatedDate);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ breachId: string }> },
): Promise<Response> {
  const { breachId } = await params;

  // Gate + RLS: solo brechas del diagnóstico activo pagado de la empresa.
  const breach = await loadClientBreach(breachId);
  if (!breach) return Response.json({ error: "not_found" }, { status: 404 });

  const md = await loadProposalMarkdown(breach.breachCode);
  if (!md) return Response.json({ error: "not_found" }, { status: 404 });

  const [result, t] = await Promise.all([
    loadClientTemplateVars(),
    getTranslations("documents.proposal"),
  ]);
  if (!result.ok) {
    return Response.json(
      { error: result.error },
      { status: REPORT_ERROR_STATUS[result.error] },
    );
  }

  try {
    const filled = fillTokens(md, result.vars);
    const html = renderDocument({
      title: markdownTitle(md) ?? t("title"),
      brand: t("brand"),
      bodyHtml: markdownToHtml(filled),
      meta: {
        generated: t("generatedLabel", { date: result.vars.generatedDate }),
        folio: result.vars.companyRut || undefined,
      },
    });
    const pdf = await renderPdf(html);
    const safe = breach.breachCode.toLowerCase();
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="propuesta-mitigacion-${safe}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (cause) {
    console.error(`[documents] propuesta ${breach.breachCode} falló:`, cause);
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}
