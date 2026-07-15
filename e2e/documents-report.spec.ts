import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { computeRutDv, formatRut, isDummyRut } from "@/lib/companies/rut";

/**
 * E2E — descarga del Informe de diagnóstico (PDF).
 * Siembra, vía service-role contra el Supabase LOCAL:
 *   - un cliente PAGADO con diagnóstico activo + brecha (descarga por /portal).
 *   - un consultor (auth user + profiles.role='consultant') que descarga el
 *     informe de esa empresa por /app.
 * Verifica bytes %PDF y application/pdf; y que el cliente NO pagado recibe 403.
 */

const RUN_ID = Date.now();
const PAID_EMAIL = `e2e-doc-paid-${RUN_ID}@dpc.local`;
const UNPAID_EMAIL = `e2e-doc-unpaid-${RUN_ID}@dpc.local`;
const CONSULTANT_EMAIL = `e2e-doc-consultant-${RUN_ID}@dpc.local`;
const PASSWORD = "e2e-doc-2026";

function loadEnvLocal(): Record<string, string> {
  const envPath = path.resolve(__dirname, "..", ".env.local");
  const raw = readFileSync(envPath, "utf8");
  const env: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function getAdminClient(): SupabaseClient {
  const env = loadEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("[documents-report.spec] faltan env NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function generateUniqueRut(offset: number): string {
  for (let attempt = 0; attempt < 5; attempt++) {
    const body = String(1_000_000 + ((RUN_ID + offset + attempt) % 8_999_999)).padStart(7, "0");
    if (isDummyRut(body)) continue;
    const dv = computeRutDv(body);
    return formatRut(`${body}${dv}`);
  }
  throw new Error("[documents-report.spec] no se pudo generar un RUT único no-dummy");
}

async function createAuthUser(admin: SupabaseClient, email: string): Promise<string> {
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (!error) return created.user.id;
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!existing) throw new Error(`[documents-report.spec] no se pudo recuperar ${email}`);
  await admin.auth.admin.updateUserById(existing.id, { password: PASSWORD, email_confirm: true });
  return existing.id;
}

async function seedClient(
  admin: SupabaseClient,
  { email, rutOffset, paid }: { email: string; rutOffset: number; paid: boolean },
): Promise<string> {
  const userId = await createAuthUser(admin, email);
  const rut = generateUniqueRut(rutOffset);
  const { data: company, error: companyError } = await admin
    .from("companies")
    .insert({
      name: `E2E Doc ${paid ? "Pagado" : "NoPagado"} ${RUN_ID}`,
      rut,
      phase: "diagnostico",
      ...(paid ? { service_paid_at: new Date().toISOString() } : {}),
    })
    .select("id")
    .single();
  if (companyError) throw new Error(`[documents-report.spec] insert companies: ${companyError.message}`);
  const companyId = company.id as string;

  await admin.from("company_members").upsert(
    { user_id: userId, company_id: companyId, status: "active" },
    { onConflict: "user_id" },
  );

  const { data: diagnosis, error: diagError } = await admin
    .from("company_diagnoses")
    .insert({
      company_id: companyId,
      source: "self_service",
      answers: {},
      risk_level: "alto",
      total_breaches: 1,
      status: "active",
    })
    .select("id")
    .single();
  if (diagError) throw new Error(`[documents-report.spec] insert diagnoses: ${diagError.message}`);

  await admin.from("diagnosis_breaches").insert({
    diagnosis_id: diagnosis.id,
    breach_code: "B-SEG-003",
    area: "SEG",
    area_label: "Seguridad de la información",
    severity: "critico",
    articles: ["Art. 14 quáter"],
    fine_min_utm: 100,
    fine_max_utm: 5000,
    description: "No existen registros de auditoría.",
  });

  return companyId;
}

async function seedConsultant(admin: SupabaseClient): Promise<void> {
  const userId = await createAuthUser(admin, CONSULTANT_EMAIL);
  await admin.from("profiles").upsert(
    { user_id: userId, full_name: "E2E Consultor", role: "consultant" },
    { onConflict: "user_id" },
  );
}

async function login(page: import("@playwright/test").Page, email: string, url: RegExp) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(url);
}

let paidCompanyId = "";

test.describe("Documentos — informe de diagnóstico", () => {
  test.beforeAll(async () => {
    const admin = getAdminClient();
    paidCompanyId = await seedClient(admin, { email: PAID_EMAIL, rutOffset: 11, paid: true });
    await seedClient(admin, { email: UNPAID_EMAIL, rutOffset: 12, paid: false });
    await seedConsultant(admin);
  });

  test("cliente pagado descarga el informe en PDF", async ({ page }) => {
    await login(page, PAID_EMAIL, /\/portal$/);
    const res = await page.request.get("/portal/evaluaciones/informe");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/pdf");
    const body = await res.body();
    expect(body.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });

  test("cliente no pagado recibe 403", async ({ page }) => {
    await login(page, UNPAID_EMAIL, /\/portal$/);
    const res = await page.request.get("/portal/evaluaciones/informe");
    expect(res.status()).toBe(403);
  });

  test("consultor descarga el informe de la empresa en PDF", async ({ page }) => {
    await login(page, CONSULTANT_EMAIL, /\/app/);
    const res = await page.request.get(`/app/companies/${paidCompanyId}/informe`);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/pdf");
    const body = await res.body();
    expect(body.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });
});
