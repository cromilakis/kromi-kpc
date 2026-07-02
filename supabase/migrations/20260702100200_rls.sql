-- ============================================================================
-- Migración: seguridad — políticas RLS explícitas, triggers e índices
-- Doctrina de calidad N4 (risk: high, data_level: personal/sensitive):
--   - RLS habilitado en TODAS las tablas, sin excepción (el enable vive en la
--     migración que crea cada tabla; acá van políticas, funciones y grants).
--   - Políticas EXPLÍCITAS por operación (select/insert/update/delete).
--   - anon: CERO acceso directo a tablas. Flujos públicos:
--       a) verificación de certificado → función verify_certificate() (RPC).
--       b) leads del autoevaluador → INSERT vía service role (server action).
--   - audit_log append-only: INSERT consultores, SELECT solo admin.
--   - updated_at por trigger; índices en todas las FK.
-- Depende de: 20260702100000_catalog.sql, 20260702100100_operations.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Funciones auxiliares
-- ----------------------------------------------------------------------------

-- ¿El usuario autenticado es parte del equipo (consultant o admin)?
-- SECURITY DEFINER + search_path fijado: evita recursión de RLS sobre profiles
-- y el hijack por search_path mutable.
create or replace function public.is_consultant()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role in ('consultant', 'admin')
  );
$$;

-- ¿El usuario autenticado es admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
  );
$$;

revoke all on function public.is_consultant() from public, anon;
grant execute on function public.is_consultant() to authenticated;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Trigger genérico de updated_at (función propia, sin depender de moddatetime).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 2. Verificación pública de certificados (único acceso anon, vía RPC)
-- ----------------------------------------------------------------------------
-- Devuelve SOLO los campos públicos del certificado: nada de score, evidencias
-- ni datos internos. SECURITY DEFINER con search_path pinneado.
create or replace function public.verify_certificate(cert_code text)
returns table (
  company_name text,
  status       text,
  issued_at    date,
  valid_until  date
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    co.name        as company_name,
    cert.status::text as status,
    cert.issued_at,
    cert.valid_until
  from public.certificates cert
  join public.companies co on co.id = cert.company_id
  where cert.code = cert_code;
$$;

revoke all on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. Privilegios
-- ----------------------------------------------------------------------------
-- Nota: RLS ya viene habilitado (y anon revocado) desde la MISMA migración que
-- crea cada tabla (20260702100000 y 20260702100100): sin ventana de exposición.

-- Objetos futuros creados por las migraciones (rol postgres): que los default
-- privileges no re-otorguen nada a anon (belt and braces sobre el default
-- actual del CLI, que ya no auto-expone entidades nuevas).
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke all on functions from anon;

-- authenticated: grants DML EXPLÍCITOS (validado empíricamente: el stack
-- actual ya no auto-expone DML a los roles del API, y el remanente de los
-- defaults legacy dejaba REFERENCES/TRIGGER/TRUNCATE — este último BYPASEA
-- RLS). Se parte de cero y se otorga solo lo que las políticas gobiernan:
-- los privilegios habilitan la operación, las FILAS las decide RLS (un
-- authenticated sin fila en profiles no ve ni toca nada).
revoke all on all tables in schema public from authenticated;
grant select, insert, update, delete on
  public.sectors, public.domains, public.controls, public.risk_catalog,
  public.solution_catalog, public.profiles, public.companies,
  public.assessments, public.assessment_controls, public.evidences,
  public.company_risks, public.remediation_items, public.certificates,
  public.self_assessments
to authenticated;

-- audit_log append-only REAL a nivel de privilegios: solo select/insert
-- (nada de update/delete/truncate — a TRUNCATE no le aplica RLS).
-- Las filas siguen gobernadas por las políticas RLS de más abajo.
grant select, insert on public.audit_log to authenticated;

-- ----------------------------------------------------------------------------
-- 4. Políticas — catálogos (lectura equipo, escritura admin)
-- ----------------------------------------------------------------------------
-- El catálogo es el activo metodológico: lo mantiene el admin (fundador/abogado).

-- sectors
create policy sectors_select on public.sectors
  for select to authenticated using ((select public.is_consultant()));
create policy sectors_insert on public.sectors
  for insert to authenticated with check ((select public.is_admin()));
create policy sectors_update on public.sectors
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy sectors_delete on public.sectors
  for delete to authenticated using ((select public.is_admin()));

-- domains
create policy domains_select on public.domains
  for select to authenticated using ((select public.is_consultant()));
create policy domains_insert on public.domains
  for insert to authenticated with check ((select public.is_admin()));
create policy domains_update on public.domains
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy domains_delete on public.domains
  for delete to authenticated using ((select public.is_admin()));

-- controls
create policy controls_select on public.controls
  for select to authenticated using ((select public.is_consultant()));
create policy controls_insert on public.controls
  for insert to authenticated with check ((select public.is_admin()));
create policy controls_update on public.controls
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy controls_delete on public.controls
  for delete to authenticated using ((select public.is_admin()));

-- risk_catalog
create policy risk_catalog_select on public.risk_catalog
  for select to authenticated using ((select public.is_consultant()));
create policy risk_catalog_insert on public.risk_catalog
  for insert to authenticated with check ((select public.is_admin()));
create policy risk_catalog_update on public.risk_catalog
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy risk_catalog_delete on public.risk_catalog
  for delete to authenticated using ((select public.is_admin()));

-- solution_catalog
create policy solution_catalog_select on public.solution_catalog
  for select to authenticated using ((select public.is_consultant()));
create policy solution_catalog_insert on public.solution_catalog
  for insert to authenticated with check ((select public.is_admin()));
create policy solution_catalog_update on public.solution_catalog
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy solution_catalog_delete on public.solution_catalog
  for delete to authenticated using ((select public.is_admin()));

-- ----------------------------------------------------------------------------
-- 5. Políticas — profiles (allowlist gestionada por admin)
-- ----------------------------------------------------------------------------
-- Cada usuario ve su propio perfil (necesario para el bootstrap de sesión);
-- el equipo completo lo ven consultores; solo el admin gestiona la allowlist.
create policy profiles_select on public.profiles
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_consultant()));
create policy profiles_insert on public.profiles
  for insert to authenticated with check ((select public.is_admin()));
create policy profiles_update on public.profiles
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy profiles_delete on public.profiles
  for delete to authenticated using ((select public.is_admin()));

-- ----------------------------------------------------------------------------
-- 6. Políticas — operación (CRUD del equipo consultor)
-- ----------------------------------------------------------------------------

-- companies: alta/edición consultores; borrado (destructivo) solo admin.
create policy companies_select on public.companies
  for select to authenticated using ((select public.is_consultant()));
create policy companies_insert on public.companies
  for insert to authenticated with check ((select public.is_consultant()));
create policy companies_update on public.companies
  for update to authenticated using ((select public.is_consultant())) with check ((select public.is_consultant()));
create policy companies_delete on public.companies
  for delete to authenticated using ((select public.is_admin()));

-- assessments
create policy assessments_select on public.assessments
  for select to authenticated using ((select public.is_consultant()));
create policy assessments_insert on public.assessments
  for insert to authenticated with check ((select public.is_consultant()));
create policy assessments_update on public.assessments
  for update to authenticated using ((select public.is_consultant())) with check ((select public.is_consultant()));
create policy assessments_delete on public.assessments
  for delete to authenticated using ((select public.is_consultant()));

-- assessment_controls
create policy assessment_controls_select on public.assessment_controls
  for select to authenticated using ((select public.is_consultant()));
create policy assessment_controls_insert on public.assessment_controls
  for insert to authenticated with check ((select public.is_consultant()));
create policy assessment_controls_update on public.assessment_controls
  for update to authenticated using ((select public.is_consultant())) with check ((select public.is_consultant()));
create policy assessment_controls_delete on public.assessment_controls
  for delete to authenticated using ((select public.is_consultant()));

-- evidences: en el insert, uploaded_by queda pinneado al usuario que sube
-- (o null si el registro se crea sin archivo); el cambio posterior de
-- uploaded_by se bloquea por trigger (ver sección 7) para impedir suplantar
-- la autoría de una evidencia.
create policy evidences_select on public.evidences
  for select to authenticated using ((select public.is_consultant()));
create policy evidences_insert on public.evidences
  for insert to authenticated
  with check (
    (select public.is_consultant())
    and (uploaded_by is null or uploaded_by = (select auth.uid()))
  );
create policy evidences_update on public.evidences
  for update to authenticated using ((select public.is_consultant())) with check ((select public.is_consultant()));
create policy evidences_delete on public.evidences
  for delete to authenticated using ((select public.is_consultant()));

-- company_risks
create policy company_risks_select on public.company_risks
  for select to authenticated using ((select public.is_consultant()));
create policy company_risks_insert on public.company_risks
  for insert to authenticated with check ((select public.is_consultant()));
create policy company_risks_update on public.company_risks
  for update to authenticated using ((select public.is_consultant())) with check ((select public.is_consultant()));
create policy company_risks_delete on public.company_risks
  for delete to authenticated using ((select public.is_consultant()));

-- remediation_items
create policy remediation_items_select on public.remediation_items
  for select to authenticated using ((select public.is_consultant()));
create policy remediation_items_insert on public.remediation_items
  for insert to authenticated with check ((select public.is_consultant()));
create policy remediation_items_update on public.remediation_items
  for update to authenticated using ((select public.is_consultant())) with check ((select public.is_consultant()));
create policy remediation_items_delete on public.remediation_items
  for delete to authenticated using ((select public.is_consultant()));

-- certificates: emisión/actualización (revocar, revalidar) consultores;
-- borrado (destructivo, rompe verificabilidad) solo admin.
create policy certificates_select on public.certificates
  for select to authenticated using ((select public.is_consultant()));
create policy certificates_insert on public.certificates
  for insert to authenticated with check ((select public.is_consultant()));
create policy certificates_update on public.certificates
  for update to authenticated using ((select public.is_consultant())) with check ((select public.is_consultant()));
create policy certificates_delete on public.certificates
  for delete to authenticated using ((select public.is_admin()));

-- self_assessments: el flujo público inserta vía service role (bypassa RLS,
-- SIN política anon a propósito). El equipo lee los leads; la cotización
-- asistida también puede registrarlos; depuración/retención solo admin.
create policy self_assessments_select on public.self_assessments
  for select to authenticated using ((select public.is_consultant()));
create policy self_assessments_insert on public.self_assessments
  for insert to authenticated with check ((select public.is_consultant()));
create policy self_assessments_update on public.self_assessments
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy self_assessments_delete on public.self_assessments
  for delete to authenticated using ((select public.is_admin()));

-- audit_log: append-only. INSERT consultores (el actor debe ser uno mismo),
-- SELECT solo admin. Sin políticas de UPDATE/DELETE (denegado por RLS) y con
-- privilegios revocados más arriba.
create policy audit_log_insert on public.audit_log
  for insert to authenticated
  with check ((select public.is_consultant()) and actor_id = (select auth.uid()));
create policy audit_log_select on public.audit_log
  for select to authenticated using ((select public.is_admin()));

-- ----------------------------------------------------------------------------
-- 7. Triggers de updated_at
-- ----------------------------------------------------------------------------
create trigger trg_sectors_updated_at
  before update on public.sectors
  for each row execute function public.set_updated_at();
create trigger trg_domains_updated_at
  before update on public.domains
  for each row execute function public.set_updated_at();
create trigger trg_controls_updated_at
  before update on public.controls
  for each row execute function public.set_updated_at();
create trigger trg_risk_catalog_updated_at
  before update on public.risk_catalog
  for each row execute function public.set_updated_at();
create trigger trg_solution_catalog_updated_at
  before update on public.solution_catalog
  for each row execute function public.set_updated_at();
create trigger trg_companies_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();
create trigger trg_assessments_updated_at
  before update on public.assessments
  for each row execute function public.set_updated_at();
create trigger trg_assessment_controls_updated_at
  before update on public.assessment_controls
  for each row execute function public.set_updated_at();
create trigger trg_evidences_updated_at
  before update on public.evidences
  for each row execute function public.set_updated_at();
create trigger trg_company_risks_updated_at
  before update on public.company_risks
  for each row execute function public.set_updated_at();
create trigger trg_remediation_items_updated_at
  before update on public.remediation_items
  for each row execute function public.set_updated_at();
create trigger trg_certificates_updated_at
  before update on public.certificates
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 7b. evidences.uploaded_by inmutable (integridad de autoría)
-- ----------------------------------------------------------------------------
-- Complementa la política evidences_insert: una vez registrada la autoría,
-- nadie puede reasignarla a otro usuario. Transiciones permitidas:
--   * → null: la FK uploaded_by → profiles es "on delete set null" y esa
--     acción referencial ejecuta un UPDATE que también dispara este trigger.
--   * null → auth.uid(): reclamar la autoría PROPIA de un registro sin autor
--     (fila placeholder de evidencia que luego recibe el archivo subido).
-- Cualquier otra transición (suplantar o transferir autoría) se rechaza.
create or replace function public.protect_evidence_uploader()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.uploaded_by is distinct from old.uploaded_by then
    if new.uploaded_by is null then
      return new; -- set null (FK o limpieza explícita)
    end if;
    if old.uploaded_by is null and new.uploaded_by = auth.uid() then
      return new; -- primer autor: solo uno mismo
    end if;
    raise exception 'evidences.uploaded_by es inmutable (no se puede reasignar la autoría)';
  end if;
  return new;
end;
$$;

revoke all on function public.protect_evidence_uploader() from public, anon, authenticated;

create trigger trg_evidences_protect_uploader
  before update on public.evidences
  for each row execute function public.protect_evidence_uploader();

-- ----------------------------------------------------------------------------
-- 7c. Auditoría automática de certificados (trazabilidad a nivel de BD)
-- ----------------------------------------------------------------------------
-- Toda actualización de un certificado (revocar, revalidar, corregir hash o
-- vigencia) queda en audit_log sin depender de la disciplina de la app.
-- SECURITY DEFINER (owner postgres, dueño de audit_log): la inserción del
-- rastro no depende de las políticas RLS del que ejecuta el UPDATE.
create or replace function public.audit_certificate_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_log (actor_id, action, entity, entity_id, detail)
  values (
    auth.uid(),                    -- null si el UPDATE llega por seed/servicio
    'certificate.updated',
    'certificates',
    new.id::text,
    jsonb_build_object(
      'code', new.code,
      'old', jsonb_build_object(
        'status', old.status, 'sha256_hash', old.sha256_hash,
        'valid_until', old.valid_until),
      'new', jsonb_build_object(
        'status', new.status, 'sha256_hash', new.sha256_hash,
        'valid_until', new.valid_until)
    )
  );
  return null;
end;
$$;

revoke all on function public.audit_certificate_update() from public, anon, authenticated;

create trigger trg_certificates_audit_update
  after update on public.certificates
  for each row execute function public.audit_certificate_update();

-- ----------------------------------------------------------------------------
-- 8. Índices en FK (los unique compuestos ya cubren su primera columna:
--    assessments(company_id, cycle), assessment_controls(assessment_id, control_id),
--    company_risks(company_id, risk_id))
-- ----------------------------------------------------------------------------
create index idx_controls_domain_id            on public.controls (domain_id);
create index idx_risk_catalog_domain_id        on public.risk_catalog (domain_id);
create index idx_solution_catalog_control_id   on public.solution_catalog (control_id);
create index idx_companies_sector_id           on public.companies (sector_id);
create index idx_assessment_controls_control_id on public.assessment_controls (control_id);
create index idx_evidences_company_id          on public.evidences (company_id);
create index idx_evidences_control_id          on public.evidences (control_id);
create index idx_evidences_uploaded_by         on public.evidences (uploaded_by);
create index idx_company_risks_risk_id         on public.company_risks (risk_id);
create index idx_remediation_items_company_id  on public.remediation_items (company_id);
create index idx_remediation_items_solution_id on public.remediation_items (solution_id);
create index idx_certificates_company_id       on public.certificates (company_id);
create index idx_audit_log_actor_id            on public.audit_log (actor_id);
create index idx_audit_log_entity              on public.audit_log (entity, entity_id);
create index idx_audit_log_created_at          on public.audit_log (created_at desc);

-- ============================================================================
-- -- DOWN (rollback documentado — ejecutar en orden inverso a la creación)
-- ============================================================================
-- -- Índices
-- drop index if exists public.idx_audit_log_created_at;
-- drop index if exists public.idx_audit_log_entity;
-- drop index if exists public.idx_audit_log_actor_id;
-- drop index if exists public.idx_certificates_company_id;
-- drop index if exists public.idx_remediation_items_solution_id;
-- drop index if exists public.idx_remediation_items_company_id;
-- drop index if exists public.idx_company_risks_risk_id;
-- drop index if exists public.idx_evidences_uploaded_by;
-- drop index if exists public.idx_evidences_control_id;
-- drop index if exists public.idx_evidences_company_id;
-- drop index if exists public.idx_assessment_controls_control_id;
-- drop index if exists public.idx_companies_sector_id;
-- drop index if exists public.idx_solution_catalog_control_id;
-- drop index if exists public.idx_risk_catalog_domain_id;
-- drop index if exists public.idx_controls_domain_id;
-- -- Triggers
-- drop trigger if exists trg_certificates_audit_update on public.certificates;
-- drop trigger if exists trg_evidences_protect_uploader on public.evidences;
-- drop trigger if exists trg_certificates_updated_at on public.certificates;
-- drop trigger if exists trg_remediation_items_updated_at on public.remediation_items;
-- drop trigger if exists trg_company_risks_updated_at on public.company_risks;
-- drop trigger if exists trg_evidences_updated_at on public.evidences;
-- drop trigger if exists trg_assessment_controls_updated_at on public.assessment_controls;
-- drop trigger if exists trg_assessments_updated_at on public.assessments;
-- drop trigger if exists trg_companies_updated_at on public.companies;
-- drop trigger if exists trg_solution_catalog_updated_at on public.solution_catalog;
-- drop trigger if exists trg_risk_catalog_updated_at on public.risk_catalog;
-- drop trigger if exists trg_controls_updated_at on public.controls;
-- drop trigger if exists trg_domains_updated_at on public.domains;
-- drop trigger if exists trg_sectors_updated_at on public.sectors;
-- -- Políticas (drop policy <name> on <table>; una por una, o al dropear tablas caen)
-- drop policy if exists audit_log_select on public.audit_log;
-- drop policy if exists audit_log_insert on public.audit_log;
-- drop policy if exists self_assessments_delete on public.self_assessments;
-- drop policy if exists self_assessments_update on public.self_assessments;
-- drop policy if exists self_assessments_insert on public.self_assessments;
-- drop policy if exists self_assessments_select on public.self_assessments;
-- drop policy if exists certificates_delete on public.certificates;
-- drop policy if exists certificates_update on public.certificates;
-- drop policy if exists certificates_insert on public.certificates;
-- drop policy if exists certificates_select on public.certificates;
-- drop policy if exists remediation_items_delete on public.remediation_items;
-- drop policy if exists remediation_items_update on public.remediation_items;
-- drop policy if exists remediation_items_insert on public.remediation_items;
-- drop policy if exists remediation_items_select on public.remediation_items;
-- drop policy if exists company_risks_delete on public.company_risks;
-- drop policy if exists company_risks_update on public.company_risks;
-- drop policy if exists company_risks_insert on public.company_risks;
-- drop policy if exists company_risks_select on public.company_risks;
-- drop policy if exists evidences_delete on public.evidences;
-- drop policy if exists evidences_update on public.evidences;
-- drop policy if exists evidences_insert on public.evidences;
-- drop policy if exists evidences_select on public.evidences;
-- drop policy if exists assessment_controls_delete on public.assessment_controls;
-- drop policy if exists assessment_controls_update on public.assessment_controls;
-- drop policy if exists assessment_controls_insert on public.assessment_controls;
-- drop policy if exists assessment_controls_select on public.assessment_controls;
-- drop policy if exists assessments_delete on public.assessments;
-- drop policy if exists assessments_update on public.assessments;
-- drop policy if exists assessments_insert on public.assessments;
-- drop policy if exists assessments_select on public.assessments;
-- drop policy if exists companies_delete on public.companies;
-- drop policy if exists companies_update on public.companies;
-- drop policy if exists companies_insert on public.companies;
-- drop policy if exists companies_select on public.companies;
-- drop policy if exists profiles_delete on public.profiles;
-- drop policy if exists profiles_update on public.profiles;
-- drop policy if exists profiles_insert on public.profiles;
-- drop policy if exists profiles_select on public.profiles;
-- drop policy if exists solution_catalog_delete on public.solution_catalog;
-- drop policy if exists solution_catalog_update on public.solution_catalog;
-- drop policy if exists solution_catalog_insert on public.solution_catalog;
-- drop policy if exists solution_catalog_select on public.solution_catalog;
-- drop policy if exists risk_catalog_delete on public.risk_catalog;
-- drop policy if exists risk_catalog_update on public.risk_catalog;
-- drop policy if exists risk_catalog_insert on public.risk_catalog;
-- drop policy if exists risk_catalog_select on public.risk_catalog;
-- drop policy if exists controls_delete on public.controls;
-- drop policy if exists controls_update on public.controls;
-- drop policy if exists controls_insert on public.controls;
-- drop policy if exists controls_select on public.controls;
-- drop policy if exists domains_delete on public.domains;
-- drop policy if exists domains_update on public.domains;
-- drop policy if exists domains_insert on public.domains;
-- drop policy if exists domains_select on public.domains;
-- drop policy if exists sectors_delete on public.sectors;
-- drop policy if exists sectors_update on public.sectors;
-- drop policy if exists sectors_insert on public.sectors;
-- drop policy if exists sectors_select on public.sectors;
-- -- Privilegios (restaurar defaults de Supabase si se revierte)
-- -- revoke all on all tables in schema public from authenticated;
-- -- alter default privileges in schema public grant ... to anon;  -- solo si se vuelve al default
-- (el enable RLS y los revoke de anon viven en las migraciones que crean cada tabla)
-- -- Funciones
-- drop function if exists public.audit_certificate_update();
-- drop function if exists public.protect_evidence_uploader();
-- drop function if exists public.verify_certificate(text);
-- drop function if exists public.set_updated_at();
-- drop function if exists public.is_admin();
-- drop function if exists public.is_consultant();
