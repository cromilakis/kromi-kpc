-- ============================================================================
-- Migración: Storage — bucket privado 'evidences' + políticas explícitas
-- Contratos: RFC.md §11, §17 (repositorio documental; acceso por URL firmada)
-- Contenido: bucket storage.buckets 'evidences' (public=false) y políticas
--            select/insert/update/delete sobre storage.objects restringidas
--            al equipo consultor (public.is_consultant()).
-- Nota: evidences.storage_path (operations) referencia rutas de este bucket
--       ('evidences/<company_id>/<archivo>').
-- Depende de: 20260702100200_rls.sql (public.is_consultant()).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Bucket privado de evidencias
-- ----------------------------------------------------------------------------
-- public=false: nunca se sirve contenido sin autenticación; la app entrega
-- URLs firmadas de corta vida. Límite 50 MiB por archivo y MIME acotado a
-- documentos de evidencia (pdf, imágenes, office, csv).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidences',
  'evidences',
  false,
  52428800, -- 50 MiB
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ----------------------------------------------------------------------------
-- 2. Políticas sobre storage.objects (RLS ya viene habilitado por Supabase)
-- ----------------------------------------------------------------------------
-- Solo el equipo consultor opera el bucket de evidencias; anon no tiene
-- ninguna política (cero acceso). El borrado también queda en consultores
-- porque el versionado documental vive en public.evidences, no en Storage.
create policy evidences_objects_select on storage.objects
  for select to authenticated
  using (bucket_id = 'evidences' and (select public.is_consultant()));

create policy evidences_objects_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'evidences' and (select public.is_consultant()));

create policy evidences_objects_update on storage.objects
  for update to authenticated
  using (bucket_id = 'evidences' and (select public.is_consultant()))
  with check (bucket_id = 'evidences' and (select public.is_consultant()));

create policy evidences_objects_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'evidences' and (select public.is_consultant()));

-- ============================================================================
-- -- DOWN (rollback documentado — ejecutar en orden inverso a la creación)
-- ============================================================================
-- drop policy if exists evidences_objects_delete on storage.objects;
-- drop policy if exists evidences_objects_update on storage.objects;
-- drop policy if exists evidences_objects_insert on storage.objects;
-- drop policy if exists evidences_objects_select on storage.objects;
-- delete from storage.buckets where id = 'evidences';
--   -- (requiere el bucket vacío: borrar antes los objetos con
--   --  delete from storage.objects where bucket_id = 'evidences';)
