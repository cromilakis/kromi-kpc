-- Los factores de complejidad declarados en el alta se necesitan en tiempo de
-- entrevista para calcular la aplicabilidad de los controles. Hoy solo se usan
-- para el score/audit y no se persistían.
alter table public.companies
  add column if not exists factors text[] not null default '{}';
comment on column public.companies.factors is
  'Factores de complejidad declarados en el alta (RFC §14.3). Fuente de la aplicabilidad de controles en la entrevista.';
