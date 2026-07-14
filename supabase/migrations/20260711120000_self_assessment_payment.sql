-- ============================================================================
-- Pago online del lead del diagnóstico público (/self-assessment)
-- ----------------------------------------------------------------------------
-- El prospecto (micro/pequeña, con precio definitivo) puede pagar el servicio
-- al confirmar, vía Stripe Checkout (modo test). El estado real de pago lo fija
-- ÚNICAMENTE el webhook verificado por firma (app/api/stripe/webhook), nunca el
-- redirect de retorno. Enterprise sigue "bajo cotización" (sin pago online).
--
-- Sin RLS de INSERT/UPDATE anon a propósito (igual que el resto de la tabla):
-- el lead se inserta y el pago se concilia vía service role.
-- ============================================================================

alter table public.self_assessments
  add column if not exists payment_status   text not null default 'pending'
    check (payment_status in ('pending', 'paid')),
  add column if not exists stripe_session_id text,
  add column if not exists amount_clp        integer check (amount_clp is null or amount_clp > 0),
  add column if not exists paid_at           timestamptz;

comment on column public.self_assessments.payment_status is
  'Estado del pago del servicio: pending (default) | paid. Lo fija el webhook de Stripe verificado por firma.';
comment on column public.self_assessments.stripe_session_id is
  'Checkout Session de Stripe asociada al lead (clave de conciliación del webhook).';
comment on column public.self_assessments.amount_clp is
  'Monto cobrado en CLP (bruto, IVA incluido) al crear la Checkout Session.';

-- Conciliación del webhook: lookup por stripe_session_id.
create index if not exists self_assessments_stripe_session_id_idx
  on public.self_assessments (stripe_session_id);
