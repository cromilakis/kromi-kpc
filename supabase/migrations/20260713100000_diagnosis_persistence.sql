-- Diagnóstico persistido: fuente única de verdad del cumplimiento por empresa.
-- Poblado desde el self-service (y desde el consultor en un sub-proyecto
-- posterior). Registro inmutable (snapshot) del contenido legal de cada brecha.

create table if not exists public.company_diagnoses (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id),
  source         text not null check (source in ('self_service','consultant_assisted')),
  answers        jsonb not null,
  risk_level     text not null,
  total_breaches integer not null default 0,
  created_by     uuid references auth.users(id),
  status         text not null default 'active' check (status in ('active','superseded')),
  created_at     timestamptz not null default now()
);
create index if not exists company_diagnoses_company_id_idx
  on public.company_diagnoses (company_id);
create index if not exists company_diagnoses_active_idx
  on public.company_diagnoses (company_id) where status = 'active';

create table if not exists public.diagnosis_breaches (
  id                uuid primary key default gen_random_uuid(),
  diagnosis_id      uuid not null references public.company_diagnoses(id) on delete cascade,
  breach_code       text not null,
  area              text not null,
  area_label        text not null,
  severity          text not null,
  articles          text[] not null default '{}',
  fine_min_utm      integer,
  fine_max_utm      integer,
  description       text not null,
  dimension         integer,
  resolution_status text not null default 'open' check (resolution_status in ('open','resolved')),
  resolved_at       timestamptz,
  created_at        timestamptz not null default now()
);
create index if not exists diagnosis_breaches_diagnosis_id_idx
  on public.diagnosis_breaches (diagnosis_id);

comment on table public.company_diagnoses is
  'Corridas del diagnóstico por empresa (fuente única de verdad). answers = respuestas del cuestionario para auditoría/re-cálculo. Una active por empresa; las previas superseded.';
comment on table public.diagnosis_breaches is
  'Brechas detectadas (snapshot inmutable del contenido legal al momento del diagnóstico). resolution_status lo cambia el cliente en un sub-proyecto posterior.';

-- RLS: el cliente solo lee lo de SU empresa; la escritura va por service-role.
alter table public.company_diagnoses enable row level security;
alter table public.diagnosis_breaches enable row level security;

-- (select public.current_company_id()) en vez de public.current_company_id():
-- sigue la convención de 20260706101000_client_rls.sql (envolver la función
-- estable en un subselect para que el planner la evalúe una sola vez por
-- consulta, no por fila).
create policy company_diagnoses_client_select on public.company_diagnoses
  for select to authenticated
  using (company_id = (select public.current_company_id()));

create policy diagnosis_breaches_client_select on public.diagnosis_breaches
  for select to authenticated
  using (exists (
    select 1 from public.company_diagnoses d
    where d.id = diagnosis_breaches.diagnosis_id
      and d.company_id = (select public.current_company_id())
  ));
