import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { computeRutDv, formatRut, isDummyRut } from "@/lib/companies/rut";

/**
 * E2E — sección Evaluaciones del portal (/portal/evaluaciones).
 *
 * No hay mocking de Supabase (convención del repo): el setup siembra, vía
 * service-role contra el Supabase LOCAL, dos clientes completos:
 *   - uno PAGADO (companies.service_paid_at fijado) con un company_diagnoses
 *     activo + diagnosis_breaches, para el caso "ve el detalle".
 *   - uno NO PAGADO (mismo diagnóstico persistido, sin service_paid_at) para
 *     el caso "bloqueado".
 * Enfoque preferido sobre el flujo Stripe real (más determinista, sin
 * depender de webhooks/tarjeta de prueba), tal como sugiere el brief de la
 * tarea 6 cuando el flujo de pago resulta frágil.
 */

// ---------------------------------------------------------------------------
// Setup: dos clientes reales contra Supabase local (service role, no mock)
// ---------------------------------------------------------------------------

const RUN_ID = Date.now();
const PAID_EMAIL = `e2e-portal-paid-${RUN_ID}@dpc.local`;
const UNPAID_EMAIL = `e2e-portal-unpaid-${RUN_ID}@dpc.local`;
const PASSWORD = "e2e-portal-2026";

/** Parseo mínimo de .env.local (mismo enfoque que assisted-diagnosis.spec.ts). */
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
    throw new Error(
      "[portal-evaluaciones.spec] faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env.local",
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** RUT válido y único por corrida (no "de relleno"), derivado del timestamp + offset. */
function generateUniqueRut(offset: number): string {
  for (let attempt = 0; attempt < 5; attempt++) {
    const body = String(1_000_000 + ((RUN_ID + offset + attempt) % 8_999_999)).padStart(
      7,
      "0",
    );
    if (isDummyRut(body)) continue;
    const dv = computeRutDv(body);
    return formatRut(`${body}${dv}`);
  }
  throw new Error("[portal-evaluaciones.spec] no se pudo generar un RUT único no-dummy");
}

async function createAuthUser(admin: SupabaseClient, email: string): Promise<string> {
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (!createError) return created.user.id;

  const alreadyExists =
    createError.code === "email_exists" || /already/i.test(createError.message);
  if (!alreadyExists) {
    throw new Error(`[portal-evaluaciones.spec] createUser falló: ${createError.message}`);
  }
  const { data: list, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listError) {
    throw new Error(`[portal-evaluaciones.spec] listUsers falló: ${listError.message}`);
  }
  const existing = list.users.find(
    (candidate) => candidate.email?.toLowerCase() === email.toLowerCase(),
  );
  if (!existing) {
    throw new Error(`[portal-evaluaciones.spec] el usuario ${email} existe pero no se pudo recuperar.`);
  }
  const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
    password: PASSWORD,
    email_confirm: true,
  });
  if (updateError) {
    throw new Error(`[portal-evaluaciones.spec] updateUserById falló: ${updateError.message}`);
  }
  return existing.id;
}

interface SeedResult {
  companyId: string;
}

/**
 * Siembra empresa + membresía activa + diagnóstico persistido con brechas.
 * `paid` controla si se fija `service_paid_at` (gate de acceso a Evaluaciones).
 */
async function seedClient(
  admin: SupabaseClient,
  { email, rutOffset, companyLabel, paid }: {
    email: string;
    rutOffset: number;
    companyLabel: string;
    paid: boolean;
  },
): Promise<SeedResult> {
  const userId = await createAuthUser(admin, email);
  const rut = generateUniqueRut(rutOffset);

  const { data: company, error: companyError } = await admin
    .from("companies")
    .insert({
      name: `E2E Portal ${companyLabel} ${RUN_ID}`,
      rut,
      phase: "diagnostico",
      ...(paid ? { service_paid_at: new Date().toISOString() } : {}),
    })
    .select("id")
    .single();
  if (companyError) {
    throw new Error(`[portal-evaluaciones.spec] insert companies falló: ${companyError.message}`);
  }
  const companyId = company.id as string;

  const { error: memberError } = await admin.from("company_members").upsert(
    { user_id: userId, company_id: companyId, status: "active" },
    { onConflict: "user_id" },
  );
  if (memberError) {
    throw new Error(
      `[portal-evaluaciones.spec] upsert company_members falló: ${memberError.message}`,
    );
  }

  const { data: diagnosis, error: diagnosisError } = await admin
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
  if (diagnosisError) {
    throw new Error(
      `[portal-evaluaciones.spec] insert company_diagnoses falló: ${diagnosisError.message}`,
    );
  }

  const { error: breachError } = await admin.from("diagnosis_breaches").insert({
    diagnosis_id: diagnosis.id,
    breach_code: "B-SEG-003",
    area: "SEG",
    area_label: "Seguridad de la información",
    severity: "critico",
    articles: ["Art. 14 quáter"],
    fine_min_utm: 100,
    fine_max_utm: 5000,
    description: "No existen registros de auditoría ni respaldos periódicos de la información.",
  });
  if (breachError) {
    throw new Error(
      `[portal-evaluaciones.spec] insert diagnosis_breaches falló: ${breachError.message}`,
    );
  }

  return { companyId };
}

test.describe("Portal — Evaluaciones", () => {
  test.beforeAll(async () => {
    const admin = getAdminClient();
    await seedClient(admin, {
      email: PAID_EMAIL,
      rutOffset: 1,
      companyLabel: "Pagado",
      paid: true,
    });
    await seedClient(admin, {
      email: UNPAID_EMAIL,
      rutOffset: 2,
      companyLabel: "NoPagado",
      paid: false,
    });
  });

  test("cliente pagado ve la lista de brechas y el detalle", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill(PAID_EMAIL);
    await page.getByLabel("Contraseña").fill(PASSWORD);
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page).toHaveURL(/\/portal$/);

    await page.goto("/portal/evaluaciones");
    await expect(page.getByText("Hallazgo").first()).toBeVisible();

    await page.getByText("Seguridad de la información").first().click();
    await expect(page).toHaveURL(/\/portal\/evaluaciones\/[0-9a-f-]{36}$/);
    await expect(page.getByText("Qué dice la ley")).toBeVisible();
    await expect(page.getByText(/Multa:\s*\$/)).toBeVisible();
  });

  test("cliente no pagado ve el estado bloqueado y no lista brechas", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill(UNPAID_EMAIL);
    await page.getByLabel("Contraseña").fill(PASSWORD);
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page).toHaveURL(/\/portal$/);

    await page.goto("/portal/evaluaciones");
    await expect(
      page.getByText("Completa tu pago para ver tus evaluaciones"),
    ).toBeVisible();
    await expect(page.getByText("Seguridad de la información")).toHaveCount(0);
  });
});
