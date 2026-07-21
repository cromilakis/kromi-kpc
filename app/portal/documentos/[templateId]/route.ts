import { getTranslations } from "next-intl/server";
import { renderDocument } from "@/lib/documents/layout";
import { renderPdf } from "@/lib/documents/render.server";
import { REPORT_ERROR_STATUS } from "@/lib/documents/report-http";
import { loadClientTemplateVars } from "@/lib/documents/templates/load-template-vars.server";
import { getTemplate, templateFilename } from "@/lib/documents/templates/registry";

/**
 * GET /portal/documentos/[templateId] — descarga un documento tipo de
 * mitigación personalizado con los datos de la empresa (gated a pagado, RLS).
 * Se regenera on-demand, igual que el informe (decisión del sub-proyecto #4).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ templateId: string }> },
): Promise<Response> {
  const { templateId } = await params;
  const template = getTemplate(templateId);
  if (!template) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const [result, t] = await Promise.all([
    loadClientTemplateVars(),
    getTranslations("documents.template"),
  ]);
  if (!result.ok) {
    return Response.json(
      { error: result.error },
      { status: REPORT_ERROR_STATUS[result.error] },
    );
  }

  try {
    const html = renderDocument({
      title: template.title,
      brand: t("brand"),
      bodyHtml: template.buildBodyHtml(result.vars),
      meta: {
        generated: t("generatedLabel", { date: result.vars.generatedDate }),
        folio: result.vars.companyRut || undefined,
      },
    });
    const pdf = await renderPdf(html);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${templateFilename(
          template.id,
          result.vars.companyRut,
        )}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (cause) {
    // Nunca un PDF vacío: ante fallo de render, error explícito (mismo criterio
    // que respond-with-report).
    console.error(`[documents] render de plantilla ${template.id} falló:`, cause);
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}
