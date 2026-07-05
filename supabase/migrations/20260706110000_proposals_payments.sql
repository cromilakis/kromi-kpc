-- ============================================================================
-- Migración: proposals + payments — Fase 2 (propuesta, aceptación y pago)
-- Contratos: docs/superpowers/plans/2026-07-05-company-portal-phase2.md (Task 1)
-- Decisión de la épica: la aceptación de la propuesta va por SERVER ACTION
-- (con la sesión del propio cliente; RLS de SELECT ya garantiza scope) y la
-- conciliación del pago va por WEBHOOK con service-role (autenticado por la
-- firma de Stripe, sin sesión de usuario). Por eso el cliente NUNCA recibe
-- policy de INSERT/UPDATE/DELETE sobre proposals ni payments: solo SELECT.
-- Esto evita tener que razonar sobre "with check" que permitan una transición
-- de estado específica desde el cliente (más simple y más difícil de explotar).
-- Depende de: 20260702100100_operations.sql (set_updated_at()),
--             20260702100200_rls.sql (is_consultant()),
--             20260706100000_company_members.sql (current_company_id()),
--             20260702110000_service_role_grants.sql (patrón de grants).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Enums
-- ----------------------------------------------------------------------------
create type public.proposal_status as enum
  ('draft', 'sent', 'accepted', 'paid', 'expired');

create type public.payment_status as enum ('pending', 'paid', 'failed');

-- ----------------------------------------------------------------------------
-- 2. proposals — propuesta (plan + precio) publicada por el consultor
-- ----------------------------------------------------------------------------
create table public.proposals (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies (id) on delete cascade,
  plan         text not null,
  amount_clp   int not null check (amount_clp > 0),
  currency     text not null default 'clp',
  status       public.proposal_status not null default 'draft',
  created_by   uuid references auth.users (id),
  accepted_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.proposals is
  'Propuesta (plan + monto CLP) publicada por el consultor. El cliente NUNCA ve complexity_score; solo el monto final. Aceptación vía server action (sin UPDATE directo del cliente, ver RLS abajo).';

create trigger trg_proposals_updated_at
  before update on public.proposals
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. payments — pagos vía Stripe Checkout, conciliados por el webhook
-- ----------------------------------------------------------------------------
create table public.payments (
  id                    uuid primary key default gen_random_uuid(),
  proposal_id           uuid not null references public.proposals (id) on delete cascade,
  company_id            uuid not null references public.companies (id) on delete cascade,
  stripe_session_id     text unique,
  stripe_payment_intent text,
  amount_clp            int,
  status                public.payment_status not null default 'pending',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.payments is
  'Pago asociado a una propuesta (Stripe Checkout, modo test). Fuente de verdad = webhook verificado por firma (service-role); el cliente solo lee (SELECT).';

create trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. Seguridad inmediata (sin ventana de exposición)
-- ----------------------------------------------------------------------------
alter table public.proposals enable row level security;
alter table public.payments  enable row level security;

-- anon: cero acceso directo (defensa en profundidad además de RLS).
revoke all on public.proposals, public.payments from anon;

-- ----------------------------------------------------------------------------
-- 5. Privilegios DML (RLS abajo restringe filas)
-- ----------------------------------------------------------------------------
-- service_role: necesario para el webhook de Task 5 (marca payments/proposals
-- como 'paid' sin sesión de usuario, autenticado por la firma de Stripe).
revoke all on public.proposals, public.payments from anon, authenticated;
grant select, insert, update, delete on public.proposals, public.payments to authenticated;
grant select, insert, update, delete on public.proposals, public.payments to service_role;

-- ----------------------------------------------------------------------------
-- 6. Políticas RLS
-- ----------------------------------------------------------------------------

-- Staff (consultor): gestiona propuestas y pagos por completo.
create policy proposals_staff_select on public.proposals
  for select to authenticated using ((select public.is_consultant()));
create policy proposals_staff_insert on public.proposals
  for insert to authenticated with check ((select public.is_consultant()));
create policy proposals_staff_update on public.proposals
  for update to authenticated using ((select public.is_consultant())) with check ((select public.is_consultant()));
create policy proposals_staff_delete on public.proposals
  for delete to authenticated using ((select public.is_consultant()));

create policy payments_staff_select on public.payments
  for select to authenticated using ((select public.is_consultant()));
create policy payments_staff_insert on public.payments
  for insert to authenticated with check ((select public.is_consultant()));
create policy payments_staff_update on public.payments
  for update to authenticated using ((select public.is_consultant())) with check ((select public.is_consultant()));
create policy payments_staff_delete on public.payments
  for delete to authenticated using ((select public.is_consultant()));

-- Cliente: SOLO lectura de SU propuesta/pagos (company_id = current_company_id()).
-- Deliberadamente SIN policy de INSERT/UPDATE/DELETE para el cliente:
--   - Aceptar la propuesta ('sent' -> 'accepted') es una server action que
--     lee con la sesión del cliente (RLS de SELECT ya garantiza el scope) y
--     escribe con service-role tras validar con Zod + verificar pertenencia.
--   - Marcar el pago como 'paid' ocurre SOLO en el webhook de Stripe
--     (service-role, autenticado por firma, sin sesión de usuario).
-- Dar UPDATE directo al cliente obligaría a policies "with check" que acoten
-- transiciones de estado válidas; se prefiere la superficie más simple y más
-- difícil de explotar: cero mutación de cliente sobre estas tablas.
create policy proposals_client_select on public.proposals
  for select to authenticated using (company_id = (select public.current_company_id()));

create policy payments_client_select on public.payments
  for select to authenticated using (company_id = (select public.current_company_id()));

-- ============================================================================
-- -- DOWN (rollback documentado)
-- ============================================================================
-- drop policy if exists payments_client_select on public.payments;
-- drop policy if exists proposals_client_select on public.proposals;
-- drop policy if exists payments_staff_delete on public.payments;
-- drop policy if exists payments_staff_update on public.payments;
-- drop policy if exists payments_staff_insert on public.payments;
-- drop policy if exists payments_staff_select on public.payments;
-- drop policy if exists proposals_staff_delete on public.proposals;
-- drop policy if exists proposals_staff_update on public.proposals;
-- drop policy if exists proposals_staff_insert on public.proposals;
-- drop policy if exists proposals_staff_select on public.proposals;
-- drop trigger if exists trg_payments_updated_at on public.payments;
-- drop trigger if exists trg_proposals_updated_at on public.proposals;
-- drop table if exists public.payments;
-- drop table if exists public.proposals;
-- drop type if exists public.payment_status;
-- drop type if exists public.proposal_status;
