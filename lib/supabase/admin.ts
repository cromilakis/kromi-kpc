import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase con service role — EXCLUSIVO de servidor (server actions /
 * route handlers). Bypassa RLS: usarlo solo para operaciones puntuales sin
 * contexto de usuario (p. ej. insertar leads anónimos del autoevaluador,
 * cuya tabla self_assessments no tiene política de INSERT anon a propósito).
 *
 * SUPABASE_SERVICE_ROLE_KEY no lleva prefijo NEXT_PUBLIC_: Next jamás lo
 * inyecta en bundles de cliente, así que un import accidental desde el
 * cliente cae en el guard de env de abajo (la clave nunca existe allí).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase admin no configurado: faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor.",
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
