-- ============================================================================
-- Migración: catálogos del Marco DPC (Data Protection Compliance)
-- Contratos: RFC.md §6-§9, design/prototype-analysis.md §4-§5
-- Contenido: sectors (rubros), domains (14 dominios), controls (fichas de
--            control), risk_catalog (riesgos reutilizables), solution_catalog
--            (remedios parametrizados).
-- Nota: los catálogos son el activo de propiedad intelectual del marco; la
--       operación por empresa vive en 20260702100100_operations.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enums de catálogo
-- ----------------------------------------------------------------------------

-- Tipo de dominio: 8 por principio (Art. 3, Ley 21.719) + 6 complementarios.
create type public.domain_kind as enum ('principle', 'complementary');

-- Clasificación del riesgo del catálogo (RFC §8).
create type public.risk_classification as enum ('transversal', 'sectorial');

-- ----------------------------------------------------------------------------
-- sectors — rubros corporativos (RFC §11: clasificación por rubro)
-- ----------------------------------------------------------------------------
create table public.sectors (
  id                    uuid primary key default gen_random_uuid(),
  code                  text not null unique,
  name                  text not null,
  -- Multiplicador sectorial del Complexity Score (prototipo: 1.1 a 1.8).
  complexity_multiplier numeric(3, 2) not null default 1.00
                        check (complexity_multiplier >= 1.00),
  -- Leyes complementarias que el rubro activa automáticamente.
  laws                  text[] not null default '{}',
  sort                  int not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.sectors is
  'Rubros corporativos: activan leyes complementarias y el multiplicador sectorial del Complexity Score (RFC §11, §14.3).';

-- ----------------------------------------------------------------------------
-- domains — los 14 dominios del Marco DPC (RFC §6)
-- ----------------------------------------------------------------------------
create table public.domains (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,            -- ej. 'DPC-LIC'
  name        text not null,
  -- Principio de la Ley 21.719 u obligación operativa asociada ("rel" en el prototipo).
  principle   text,
  description text,
  kind        public.domain_kind not null default 'principle',
  sort        int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.domains is
  '14 dominios del Marco DPC: 8 alineados a principios del Art. 3 de la Ley 21.719 + 6 complementarios (RFC §6).';

-- ----------------------------------------------------------------------------
-- controls — fichas de control normalizadas (RFC §7)
-- ----------------------------------------------------------------------------
create table public.controls (
  id                    uuid primary key default gen_random_uuid(),
  code                  text not null unique,  -- ej. 'DPC-INC-002'
  domain_id             uuid not null references public.domains (id) on delete restrict,
  name                  text not null,
  objective             text,                  -- objetivo (resumen)
  detail                text,                  -- detalle explicativo
  verification_criteria text[] not null default '{}',
  legal_primary         text,                  -- fundamento legal primario
  legal_connected       text,                  -- fundamento legal conectado (null si no hay)
  risk_mitigated        text,
  -- Nombres de las evidencias requeridas por la ficha; el estado por empresa
  -- vive en public.evidences (operación).
  required_evidences    text[] not null default '{}',
  -- Chips de leyes que muestra la UI (ej. {'Ley 21.719','ISO 27001'}).
  laws                  text[] not null default '{}',
  -- Códigos de sector a los que aplica; NULL = control transversal (aplica a
  -- todos los rubros). Reservado para las verticales sectoriales (RFC §20).
  sector_scope          text[],
  sort                  int not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.controls is
  'Fichas de control del Marco DPC: objetivo, detalle, criterios de verificación, cruce normativo y evidencias requeridas (RFC §7).';
comment on column public.controls.sector_scope is
  'NULL = transversal (todos los rubros); array de sector.code para controles de verticales sectoriales.';

-- ----------------------------------------------------------------------------
-- risk_catalog — catálogo parametrizado de riesgos reutilizables (RFC §8)
-- ----------------------------------------------------------------------------
create table public.risk_catalog (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique,    -- ej. 'R-001'
  description         text not null,
  classification      public.risk_classification not null default 'transversal',
  -- Tags libres que cualifican el alcance (ej. {'fintech','salud','laboral'}).
  sector_tags         text[] not null default '{}',
  -- Dominio del marco al que se asocia el riesgo (chip de la matriz del prototipo).
  domain_id           uuid references public.domains (id) on delete set null,
  -- Escala 1-5 (mapeo del prototipo: Bajo=2, Medio=3, Alto=4, Crítico=5 /
  -- Baja=2, Media=3, Alta=4; se reservan 1 y 5 para extremos).
  default_impact      int not null check (default_impact between 1 and 5),
  default_probability int not null check (default_probability between 1 and 5),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.risk_catalog is
  'Catálogo reutilizable de riesgos del entorno chileno con impacto y probabilidad por defecto (RFC §8). La numeración tiene huecos intencionales (no existen R-003 ni R-006).';

-- ----------------------------------------------------------------------------
-- solution_catalog — catálogo de soluciones y remedios (RFC §9)
-- ----------------------------------------------------------------------------
create table public.solution_catalog (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,                   -- la alternativa de mitigación
  description text,                            -- problema identificado / contexto
  control_id  uuid references public.controls (id) on delete set null,
  -- Tags de búsqueda: código de riesgo asociado, dominio, rubro, etc.
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.solution_catalog is
  'Alternativas de mitigación previamente validadas; el cliente elige según rubro, tamaño y presupuesto (RFC §9).';

-- ----------------------------------------------------------------------------
-- Seguridad inmediata (sin ventana de exposición)
-- ----------------------------------------------------------------------------
-- RLS se habilita en la MISMA migración que crea cada tabla: si la migración
-- de políticas (20260702100200_rls.sql) fallara o se aplicara más tarde, las
-- tablas ya nacen cerradas (RLS sin políticas = deny all para no-owners).
alter table public.sectors          enable row level security;
alter table public.domains          enable row level security;
alter table public.controls         enable row level security;
alter table public.risk_catalog     enable row level security;
alter table public.solution_catalog enable row level security;

-- anon: cero acceso directo a catálogos (defensa en profundidad además de RLS).
revoke all on public.sectors, public.domains, public.controls,
  public.risk_catalog, public.solution_catalog from anon;

-- ============================================================================
-- -- DOWN (rollback documentado — ejecutar en orden inverso a la creación)
-- ============================================================================
-- (el enable RLS y los revoke caen junto con el drop de cada tabla)
-- drop table if exists public.solution_catalog;
-- drop table if exists public.risk_catalog;
-- drop table if exists public.controls;
-- drop table if exists public.domains;
-- drop table if exists public.sectors;
-- drop type if exists public.risk_classification;
-- drop type if exists public.domain_kind;
