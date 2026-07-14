-- Paywall no evadible: el diagnóstico self-service se persiste ANTES de pagar
-- y el cliente queda autenticado. Las policies de 20260713100000 acotaban SOLO
-- por company_id = current_company_id(), sin considerar el pago. Con el grant
-- a authenticated, un cliente no pagado podía leer sus brechas directo por
-- PostgREST, saltándose el gate de la página. El spec exige que el no-pagado
-- "nunca vea ninguna brecha": el gate de pago debe vivir también en la RLS.
--
-- OJO: NO se puede consultar public.companies directamente aquí. El cliente
-- NO tiene policy de SELECT sobre companies base (20260706101000_client_rls.sql:
-- "el cliente NUNCA tiene policy sobre public.companies base"); solo lee su
-- empresa vía public.company_client_view, una vista sin security_invoker que
-- corre como definer y por eso puede saltarse esa RLS y exponer
-- service_paid_at (ver 20260712100000_post_pago_portal.sql). Si esta policy
-- filtrara por EXISTS sobre companies directamente, la subconsulta se evalúa
-- con los privilegios/RLS del rol authenticated y siempre da 0 filas incluso
-- para el cliente pagado, dejando el portal vacío para todos. Por eso el
-- gate de pago se resuelve contra la vista, no la tabla base.
drop policy if exists company_diagnoses_client_select on public.company_diagnoses;
create policy company_diagnoses_client_select on public.company_diagnoses
  for select to authenticated
  using (
    company_id = (select public.current_company_id())
    and exists (
      select 1 from public.company_client_view v
      where v.id = company_id and v.service_paid_at is not null
    )
  );

drop policy if exists diagnosis_breaches_client_select on public.diagnosis_breaches;
create policy diagnosis_breaches_client_select on public.diagnosis_breaches
  for select to authenticated
  using (
    exists (
      select 1 from public.company_diagnoses d
      join public.company_client_view v on v.id = d.company_id
      where d.id = diagnosis_breaches.diagnosis_id
        and d.company_id = (select public.current_company_id())
        and v.service_paid_at is not null
    )
  );
