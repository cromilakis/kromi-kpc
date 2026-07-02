-- ============================================================================
-- Migración: tablas de operación de la plataforma DPC
-- Contratos: RFC.md §11-§14 y §17, design/prototype-analysis.md §4
-- Contenido: profiles (equipo consultor), companies, assessments,
--            assessment_controls, evidences, company_risks, remediation_items,
--            certificates, self_assessments (leads del autoevaluador),
--            audit_log (append-only).
-- Depende de: 20260702100000_catalog.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enums de operación
-- ----------------------------------------------------------------------------

-- Rol interno del equipo (la plataforma es herramienta interna, RFC §11).
create type public.user_role as enum ('consultant', 'admin');

-- Tramos de tamaño según clasificación chilena (RFC §14.2).
create type public.company_size_tier as enum ('micro', 'small', 'enterprise');

-- Fases del ciclo de servicio (RFC §14: nomenclatura en español).
create type public.company_phase as enum
  ('diagnostico', 'propuesta', 'certificacion', 'revalidacion');

-- Estado de un ciclo de evaluación.
create type public.assessment_status as enum ('open', 'in_review', 'closed');

-- Métrica de resultado por control (RFC §7: Cumple / Parcial / No cumple).
create type public.control_result as enum
  ('pending', 'compliant', 'partial', 'non_compliant');

-- Estado de una evidencia documental (validada / parcial / faltante / rechazada).
create type public.evidence_status as enum
  ('validated', 'partial', 'missing', 'rejected');

-- Estado de una tarea del plan de adecuación.
create type public.remediation_status as enum ('pending', 'in_progress', 'done');

-- Estado del certificado privado DPC.
create type public.certificate_status as enum ('active', 'expired', 'revoked');

-- ----------------------------------------------------------------------------
-- profiles — allowlist manual del equipo consultor
-- ----------------------------------------------------------------------------
-- SIN trigger de auto-creación: el alta de perfiles es manual (allowlist).
-- El primer admin se promueve vía service role / SQL directo (bootstrap).
create table public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null,
  role       public.user_role not null default 'consultant',
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'Allowlist manual del equipo consultor. Sin auto-creación: un usuario de auth.users sin fila acá no accede a nada.';

-- ----------------------------------------------------------------------------
-- companies — empresas clientes (RFC §11-§12)
-- ----------------------------------------------------------------------------
create table public.companies (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  rut              text unique,               -- RUT chileno; nullable hasta formalizar
  sector_id        uuid references public.sectors (id) on delete restrict,
  size_tier        public.company_size_tier,
  employees_count  int check (employees_count >= 0),
  phase            public.company_phase not null default 'diagnostico',
  -- Complexity Score: USO INTERNO para dimensionar esfuerzo y precio (RFC §14.3).
  -- Nunca se expone al cliente ni a la cara pública.
  complexity_score int,
  -- Datos de contacto y DPO: {"dpo": "...", "email": "...", "phone": "...", "branches": n}
  contact          jsonb not null default '{}'::jsonb,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on column public.companies.complexity_score is
  'Interno: dimensiona esfuerzo y precio (base 52 pts x multiplicador sectorial). No exponer al cliente.';

-- ----------------------------------------------------------------------------
-- assessments — ciclos de evaluación (diagnóstico, reevaluación, revalidación)
-- ----------------------------------------------------------------------------
create table public.assessments (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies (id) on delete cascade,
  cycle        int not null default 1 check (cycle >= 1),
  status       public.assessment_status not null default 'open',
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (company_id, cycle)
);

-- ----------------------------------------------------------------------------
-- assessment_controls — estado de cada control dentro de un ciclo
-- ----------------------------------------------------------------------------
-- En el prototipo controlStatus era global; acá es por assessment (por empresa
-- y ciclo), corrigiendo la limitación consciente del mock (analysis §4.3.4).
create table public.assessment_controls (
  id            uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  control_id    uuid not null references public.controls (id) on delete restrict,
  status        public.control_result not null default 'pending',
  findings      text,                          -- hallazgos (Gap Analysis)
  notes         text,
  evaluated_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (assessment_id, control_id)
);

-- ----------------------------------------------------------------------------
-- evidences — repositorio documental versionado (RFC §11, §17)
-- ----------------------------------------------------------------------------
create table public.evidences (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies (id) on delete cascade,
  control_id   uuid references public.controls (id) on delete set null,
  name         text not null,
  -- Ruta en Supabase Storage (bucket privado, acceso por URL firmada).
  storage_path text,
  version      int not null default 1 check (version >= 1),
  status       public.evidence_status not null default 'missing',
  uploaded_by  uuid references public.profiles (user_id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- company_risks — riesgos identificados por empresa (matriz impacto x prob.)
-- ----------------------------------------------------------------------------
create table public.company_risks (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  risk_id     uuid not null references public.risk_catalog (id) on delete restrict,
  impact      int not null check (impact between 1 and 5),
  probability int not null check (probability between 1 and 5),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (company_id, risk_id)
);

-- ----------------------------------------------------------------------------
-- remediation_items — plan de adecuación con seguimiento (RFC §12)
-- ----------------------------------------------------------------------------
create table public.remediation_items (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  title       text not null,
  solution_id uuid references public.solution_catalog (id) on delete set null,
  responsible text,                            -- "Área · Persona"
  due_date    date,
  status      public.remediation_status not null default 'pending',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- certificates — certificado privado DPC verificable (RFC §11, §17)
-- ----------------------------------------------------------------------------
create table public.certificates (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies (id) on delete cascade,
  code           text not null unique,         -- ej. 'DPC-CA-2026-1001' (verificable en línea)
  status         public.certificate_status not null default 'active',
  issued_at      date not null default current_date,
  valid_until    date not null,
  revalidated_at date,                         -- última revalidación (suscripción, RFC §14.1)
  -- Hash SHA-256 del expediente/certificado emitido (integridad verificable).
  sha256_hash    text not null check (sha256_hash ~ '^[0-9a-f]{64}$'),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (valid_until > issued_at)
);

comment on table public.certificates is
  'Certificado privado DPC. La verificación pública se hace exclusivamente vía la función verify_certificate() — nunca acceso directo anon.';

-- ----------------------------------------------------------------------------
-- self_assessments — leads del autoevaluador público (RFC §13)
-- ----------------------------------------------------------------------------
-- El INSERT llega vía service role desde un server action (sin política anon).
create table public.self_assessments (
  id             uuid primary key default gen_random_uuid(),
  answers        jsonb not null default '{}'::jsonb,
  size_tier      public.company_size_tier,
  -- Rubro declarado en el autoevaluador ('retail'|'fintech'|'salud'|'b2b'|
  -- 'telco'|'startup'|'estado'); texto libre porque no coincide 1:1 con
  -- sectors.code (fuente: SECTOR_CODES en lib/self-assessment/estimate.ts).
  sector_code    text,
  -- Factores de ajuste detectados: {'datos_sensibles','rubro_regulado',
  -- 'transferencias_internacionales','decisiones_automatizadas','multi_sede',
  -- 'proveedores_criticos'} (fuente: DB_RISK_FACTOR_TOKENS en estimate.ts).
  risk_factors   text[] not null default '{}',
  estimated_tier text,                         -- ej. 'Desde 5 UF + IVA' / 'Bajo cotización'
  contact_name   text,
  contact_email  text,
  contact_phone  text,
  created_at     timestamptz not null default now()
);

comment on table public.self_assessments is
  'Leads de la autoevaluación gratuita (embudo RFC §13). Datos personales de contacto: sujetos a retención y minimización (doctrina N4).';

-- ----------------------------------------------------------------------------
-- audit_log — bitácora append-only de acciones sensibles (doctrina N4)
-- ----------------------------------------------------------------------------
create table public.audit_log (
  id         bigint generated always as identity primary key,
  actor_id   uuid references auth.users (id) on delete set null,
  action     text not null,                    -- ej. 'certificate.issue', 'evidence.validate'
  entity     text not null,                    -- nombre de la tabla/entidad
  entity_id  text,                             -- id de la fila afectada (texto: admite uuid o código)
  detail     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.audit_log is
  'Append-only: sin políticas ni permisos de UPDATE/DELETE. INSERT consultores, SELECT solo admins (ver migración RLS).';

-- ----------------------------------------------------------------------------
-- Seguridad inmediata (sin ventana de exposición)
-- ----------------------------------------------------------------------------
-- RLS se habilita en la MISMA migración que crea cada tabla: si la migración
-- de políticas (20260702100200_rls.sql) fallara o se aplicara más tarde, las
-- tablas ya nacen cerradas (RLS sin políticas = deny all para no-owners).
alter table public.profiles            enable row level security;
alter table public.companies           enable row level security;
alter table public.assessments         enable row level security;
alter table public.assessment_controls enable row level security;
alter table public.evidences           enable row level security;
alter table public.company_risks       enable row level security;
alter table public.remediation_items   enable row level security;
alter table public.certificates        enable row level security;
alter table public.self_assessments    enable row level security;
alter table public.audit_log           enable row level security;

-- anon: cero acceso directo (defensa en profundidad además de RLS).
revoke all on public.profiles, public.companies, public.assessments,
  public.assessment_controls, public.evidences, public.company_risks,
  public.remediation_items, public.certificates, public.self_assessments,
  public.audit_log from anon;

-- ============================================================================
-- -- DOWN (rollback documentado — ejecutar en orden inverso a la creación)
-- ============================================================================
-- (el enable RLS y los revoke caen junto con el drop de cada tabla)
-- drop table if exists public.audit_log;
-- drop table if exists public.self_assessments;
-- drop table if exists public.certificates;
-- drop table if exists public.remediation_items;
-- drop table if exists public.company_risks;
-- drop table if exists public.evidences;
-- drop table if exists public.assessment_controls;
-- drop table if exists public.assessments;
-- drop table if exists public.companies;
-- drop table if exists public.profiles;
-- drop type if exists public.certificate_status;
-- drop type if exists public.remediation_status;
-- drop type if exists public.evidence_status;
-- drop type if exists public.control_result;
-- drop type if exists public.assessment_status;
-- drop type if exists public.company_phase;
-- drop type if exists public.company_size_tier;
-- drop type if exists public.user_role;
