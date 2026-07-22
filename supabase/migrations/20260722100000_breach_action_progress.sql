-- Progreso de mitigación POR ACCIÓN (no por brecha).
-- Modelo nuevo (2026-07-22): el cliente ya no autodeclara "brecha abordada";
-- marca cada acción del plan de mitigación como resuelta. Una brecha queda
-- 'resolved' cuando TODAS sus acciones (definidas en lib/legal por breach_code)
-- están en este arreglo. La escritura sigue yendo por service-role tras
-- verificar pertenencia (lib/actions/portal-resolution.ts): la RLS de
-- diagnosis_breaches sigue siendo de solo lectura para el cliente, así que esta
-- migración es puramente aditiva y NO toca políticas.
alter table public.diagnosis_breaches
  add column if not exists resolved_action_idxs int[] not null default '{}';

comment on column public.diagnosis_breaches.resolved_action_idxs is
  'Índices (0-based) de las acciones del plan de mitigación marcadas como resueltas por el cliente. resolution_status pasa a resolved cuando cubre todas las acciones del breach_code. Lo escribe el servidor (service-role) tras verificar pertenencia.';
