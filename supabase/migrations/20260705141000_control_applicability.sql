-- Regla de aplicabilidad por control: null = siempre aplica (baseline); ante
-- cualquier duda se deja null (nunca ocultar de más). Se evalúa en la
-- entrevista dinámica contra los factores declarados por la empresa
-- (companies.factors).
alter table public.controls add column if not exists applies_when jsonb;
comment on column public.controls.applies_when is
  'Regla de aplicabilidad: null = siempre aplica; {"factors_any":[...]} = aplica solo si la empresa declaró alguno de esos factores.';

-- Poblado por dominio (ante duda, se deja null = aplica). Revisar con abogado.
update public.controls c set applies_when = '{"factors_any":["sensitive_data"]}'::jsonb
  from public.domains d where c.domain_id = d.id and d.code = 'DPC-SEN';

update public.controls c set applies_when = '{"factors_any":["automated_decisions"]}'::jsonb
  from public.domains d where c.domain_id = d.id and d.code = 'DPC-EIA';

-- DPC-TER mezcla transferencias internacionales y encargados del tratamiento.
-- Se asigna por code explícito, verificado contra el catálogo local:
--   DPC-TER-001 "Contratos con encargados del tratamiento" -> critical_providers
--   DPC-TER-002 "Transferencias internacionales con garantías de adecuación" -> international_transfers
update public.controls c set applies_when = '{"factors_any":["critical_providers"]}'::jsonb
  where c.code = 'DPC-TER-001';

update public.controls c set applies_when = '{"factors_any":["international_transfers"]}'::jsonb
  where c.code = 'DPC-TER-002';
