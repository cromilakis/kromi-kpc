-- Fix: 20260713100000_diagnosis_persistence.sql definió RLS + policies de
-- solo-lectura para el cliente sobre company_diagnoses/diagnosis_breaches,
-- pero olvidó el GRANT de tabla a `authenticated` (convención del repo: el
-- rol authenticated no tiene privilegios de tabla por defecto — cada tabla
-- los otorga explícitamente, ver company_members/proposals/payments). Sin
-- este grant, PostgREST devuelve "permission denied for table" (42501) para
-- CUALQUIER select del cliente, incluso cuando la RLS lo permitiría — el
-- portal de Evaluaciones quedaba siempre vacío. Solo lectura: la escritura
-- de estas tablas es exclusiva de service-role (self-service / consultor).
grant select on public.company_diagnoses to authenticated;
grant select on public.diagnosis_breaches to authenticated;
