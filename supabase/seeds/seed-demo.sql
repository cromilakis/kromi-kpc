-- ============================================================================
-- Seed DEMO — SOLO local/desarrollo. NUNCA aplicar en producción.
-- Se ejecuta después del seed canónico vía config.toml [db.seed].sql_paths.
-- Las 6 empresas demo del prototipo, con un ciclo de evaluación cada una.
--
-- TODOS los RUTs de este archivo son FICTICIOS, sin excepción. Incluido el de
-- Clínica Andes Salud: 76.421.905-K tiene dígito verificador inválido a
-- propósito (el DV módulo 11 correcto de 76.421.905 sería 8), de modo que no
-- pueda coincidir con un RUT real.
--
-- Convención UI (mapeo asumido): una evidencia requerida por la ficha
-- (controls.required_evidences) que NO tiene fila en public.evidences se
-- muestra como 'faltante'. evidences.status solo describe el estado de las
-- evidencias efectivamente aportadas (validated/partial/missing/rejected).
-- ============================================================================
begin;

-- Empresas demo (UUIDs fijos para idempotencia)
insert into public.companies
  (id, name, rut, sector_id, size_tier, employees_count, phase, complexity_score, contact, notes, created_at)
values
  ('20000000-0000-4000-8000-000000000001', 'Clínica Andes Salud', '76.421.905-K',
   (select id from public.sectors where code = 'salud'), 'enterprise', 480, 'certificacion', 88,
   '{"dpo": "M. Fuentes", "branches": 6}'::jsonb, 'Razón social: Clínica Andes Salud SpA. 6 sucursales.', '2026-05-02'),
  ('20000000-0000-4000-8000-000000000002', 'Aurora Pay', '77.102.334-6',
   (select id from public.sectors where code = 'fintech'), 'enterprise', 120, 'propuesta', 94,
   '{"dpo": "R. Cáceres"}'::jsonb, null, '2026-05-20'),
  ('20000000-0000-4000-8000-000000000003', 'Tienda Norte Retail', '76.884.221-0',
   (select id from public.sectors where code = 'retail'), 'small', 35, 'diagnostico', 62,
   '{}'::jsonb, 'Sin DPO designado.', '2026-06-19'),
  ('20000000-0000-4000-8000-000000000004', 'Nexo Servicios B2B', '76.550.912-3',
   (select id from public.sectors where code = 'b2b'), 'enterprise', 210, 'revalidacion', 68,
   '{"dpo": "C. Álvarez"}'::jsonb, null, '2026-03-26'),
  ('20000000-0000-4000-8000-000000000005', 'Kappa Labs', '77.410.087-5',
   (select id from public.sectors where code = 'startup'), 'micro', 9, 'diagnostico', 57,
   '{}'::jsonb, 'Sin DPO designado.', '2026-06-23'),
  ('20000000-0000-4000-8000-000000000006', 'RedFibra Telecom', '76.930.144-8',
   (select id from public.sectors where code = 'telco'), 'enterprise', 320, 'propuesta', 83,
   '{"dpo": "P. Rojas"}'::jsonb, null, '2026-05-29')
on conflict (id) do update set
  name = excluded.name,
  rut = excluded.rut,
  sector_id = excluded.sector_id,
  size_tier = excluded.size_tier,
  employees_count = excluded.employees_count,
  phase = excluded.phase,
  complexity_score = excluded.complexity_score,
  contact = excluded.contact,
  notes = excluded.notes;

-- Un ciclo de evaluación por empresa
insert into public.assessments (company_id, cycle, status, started_at, completed_at) values
  ('20000000-0000-4000-8000-000000000001', 1, 'in_review', '2026-05-02', null),
  ('20000000-0000-4000-8000-000000000002', 1, 'in_review', '2026-05-20', null),
  ('20000000-0000-4000-8000-000000000003', 1, 'open',      '2026-06-19', null),
  ('20000000-0000-4000-8000-000000000004', 1, 'closed',    '2026-03-26', '2026-06-20'),
  ('20000000-0000-4000-8000-000000000005', 1, 'open',      '2026-06-23', null),
  ('20000000-0000-4000-8000-000000000006', 1, 'in_review', '2026-05-29', null)
on conflict (company_id, cycle) do update set
  status = excluded.status,
  started_at = excluded.started_at,
  completed_at = excluded.completed_at;

-- ----------------------------------------------------------------------------
-- Coherencia narrativa (revisión adversarial):
--   * Clínica Andes tiene certificado 'active' emitido el 2026-06-28: su
--     evaluación no puede quedar con 9 controles non_compliant (perfil crudo
--     del prototipo). Decisión: perfil mayormente compliant (18 compliant /
--     5 partial / 0 non_compliant); los 5 'partial' corresponden 1:1 a los
--     ítems aún abiertos del plan de adecuación (biometría DPC-SEN-001,
--     incidentes DPC-INC-001/002, RAT DPC-INV-001, retención DPC-FIN-002).
--   * El perfil de gap del prototipo (4 cumple / 10 parcial / 9 no cumple) se
--     conserva íntegro pero se traslada a Aurora Pay, que está en fase
--     'propuesta' (gap analysis terminado, sin certificado): ahí sí es
--     narrativamente coherente.
--   * Nexo tiene certificado activo revalidado el 2026-06-20 con ciclo
--     cerrado: una evaluación toda 'pending' era incoherente. Decisión:
--     21 compliant / 2 partial (observaciones menores de la revalidación:
--     simulacro anual DPC-INC-002 y salvaguardas DPC-EIA-002).
-- ----------------------------------------------------------------------------

-- Clínica Andes Salud: 18 compliant / 5 partial (certificado emitido)
insert into public.assessment_controls (assessment_id, control_id, status, evaluated_at)
select a.id, c.id, v.status::public.control_result, '2026-06-25'::timestamptz
from (values
  ('DPC-LIC-001', 'compliant'),
  ('DPC-FIN-001', 'compliant'),
  ('DPC-FIN-002', 'partial'),
  ('DPC-PRO-001', 'compliant'),
  ('DPC-CAL-001', 'compliant'),
  ('DPC-RES-001', 'compliant'),
  ('DPC-RES-002', 'compliant'),
  ('DPC-RES-003', 'compliant'),
  ('DPC-RES-004', 'compliant'),
  ('DPC-SEG-001', 'compliant'),
  ('DPC-SEG-002', 'compliant'),
  ('DPC-TRA-001', 'compliant'),
  ('DPC-CON-001', 'compliant'),
  ('DPC-INV-001', 'partial'),
  ('DPC-INV-002', 'compliant'),
  ('DPC-DER-001', 'compliant'),
  ('DPC-SEN-001', 'partial'),
  ('DPC-TER-001', 'compliant'),
  ('DPC-TER-002', 'compliant'),
  ('DPC-INC-001', 'partial'),
  ('DPC-INC-002', 'partial'),
  ('DPC-EIA-001', 'compliant'),
  ('DPC-EIA-002', 'compliant')
) as v(code, status)
join public.controls c on c.code = v.code
cross join lateral (
  select id from public.assessments
  where company_id = '20000000-0000-4000-8000-000000000001' and cycle = 1
) a
on conflict (assessment_id, control_id) do update set
  status = excluded.status,
  evaluated_at = excluded.evaluated_at;

-- Aurora Pay: perfil de gap del prototipo (4 cumple / 10 parcial / 9 no)
insert into public.assessment_controls (assessment_id, control_id, status, evaluated_at)
select a.id, c.id, v.status::public.control_result, '2026-06-15'::timestamptz
from (values
  ('DPC-RES-001', 'partial'),
  ('DPC-RES-002', 'compliant'),
  ('DPC-RES-003', 'compliant'),
  ('DPC-RES-004', 'non_compliant'),
  ('DPC-INV-001', 'partial'),
  ('DPC-INV-002', 'non_compliant'),
  ('DPC-LIC-001', 'partial'),
  ('DPC-DER-001', 'compliant'),
  ('DPC-SEN-001', 'non_compliant'),
  ('DPC-SEG-001', 'partial'),
  ('DPC-SEG-002', 'compliant'),
  ('DPC-TER-001', 'partial'),
  ('DPC-TER-002', 'non_compliant'),
  ('DPC-INC-001', 'partial'),
  ('DPC-INC-002', 'non_compliant'),
  ('DPC-FIN-001', 'partial'),
  ('DPC-FIN-002', 'non_compliant'),
  ('DPC-PRO-001', 'non_compliant'),
  ('DPC-CAL-001', 'partial'),
  ('DPC-TRA-001', 'partial'),
  ('DPC-CON-001', 'partial'),
  ('DPC-EIA-001', 'non_compliant'),
  ('DPC-EIA-002', 'non_compliant')
) as v(code, status)
join public.controls c on c.code = v.code
cross join lateral (
  select id from public.assessments
  where company_id = '20000000-0000-4000-8000-000000000002' and cycle = 1
) a
on conflict (assessment_id, control_id) do update set
  status = excluded.status,
  evaluated_at = excluded.evaluated_at;

-- Nexo Servicios B2B: 21 compliant / 2 partial (certificado revalidado)
insert into public.assessment_controls (assessment_id, control_id, status, evaluated_at)
select a.id, c.id,
  case when c.code in ('DPC-INC-002', 'DPC-EIA-002')
       then 'partial'::public.control_result
       else 'compliant'::public.control_result end,
  '2026-06-18'::timestamptz
from public.controls c
cross join lateral (
  select id from public.assessments
  where company_id = '20000000-0000-4000-8000-000000000004' and cycle = 1
) a
on conflict (assessment_id, control_id) do update set
  status = excluded.status,
  evaluated_at = excluded.evaluated_at;

-- Empresas aún en diagnóstico o propuesta temprana: los 23 controles 'pending'
insert into public.assessment_controls (assessment_id, control_id, status)
select a.id, c.id, 'pending'
from public.assessments a
cross join public.controls c
where a.cycle = 1
  and a.company_id in (
    '20000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000005',
    '20000000-0000-4000-8000-000000000006'
  )
on conflict (assessment_id, control_id) do nothing;

-- ----------------------------------------------------------------------------
-- Riesgos identificados por empresa (subconjuntos del catálogo, reproduciendo
-- los conteos del prototipo: Clínica 3, Aurora 7, Tienda Norte 5, Nexo 1,
-- Kappa 6, RedFibra 4).
-- ----------------------------------------------------------------------------

-- Clínica Andes: 3 (biometría, cuentas clínicas, plan de brechas)
insert into public.company_risks (company_id, risk_id, impact, probability)
select '20000000-0000-4000-8000-000000000001', r.id, r.default_impact, r.default_probability
from public.risk_catalog r
where r.code in ('R-007', 'R-008', 'R-009')
on conflict (company_id, risk_id) do update set
  impact = excluded.impact,
  probability = excluded.probability;

-- Aurora Pay: los 7 del catálogo (fintech, perfil de mayor exposición)
insert into public.company_risks (company_id, risk_id, impact, probability)
select '20000000-0000-4000-8000-000000000002', r.id, r.default_impact, r.default_probability
from public.risk_catalog r
on conflict (company_id, risk_id) do update set
  impact = excluded.impact,
  probability = excluded.probability;

-- Tienda Norte Retail: 5 (transversales + Excel; sin R-007 biometría ni
-- R-008 cuentas clínicas/transaccionales, que no aplican a su operación)
insert into public.company_risks (company_id, risk_id, impact, probability)
select '20000000-0000-4000-8000-000000000003', r.id, r.default_impact, r.default_probability
from public.risk_catalog r
where r.code in ('R-001', 'R-002', 'R-004', 'R-005', 'R-009')
on conflict (company_id, risk_id) do update set
  impact = excluded.impact,
  probability = excluded.probability;

-- Nexo Servicios B2B: 1 riesgo residual en observación (empresa certificada
-- y revalidada: el resto se cerró en ciclos anteriores)
insert into public.company_risks (company_id, risk_id, impact, probability)
select '20000000-0000-4000-8000-000000000004', r.id, r.default_impact, r.default_probability
from public.risk_catalog r
where r.code in ('R-005')
on conflict (company_id, risk_id) do update set
  impact = excluded.impact,
  probability = excluded.probability;

-- Kappa Labs: 6 (startup micro sin procesos formales; todos menos R-008)
insert into public.company_risks (company_id, risk_id, impact, probability)
select '20000000-0000-4000-8000-000000000005', r.id, r.default_impact, r.default_probability
from public.risk_catalog r
where r.code in ('R-001', 'R-002', 'R-004', 'R-005', 'R-007', 'R-009')
on conflict (company_id, risk_id) do update set
  impact = excluded.impact,
  probability = excluded.probability;

-- RedFibra Telecom: 4 (transversales; en telco el foco es canal informal,
-- RAT desactualizado, políticas y plan de brechas)
insert into public.company_risks (company_id, risk_id, impact, probability)
select '20000000-0000-4000-8000-000000000006', r.id, r.default_impact, r.default_probability
from public.risk_catalog r
where r.code in ('R-001', 'R-002', 'R-005', 'R-009')
on conflict (company_id, risk_id) do update set
  impact = excluded.impact,
  probability = excluded.probability;

-- Plan de adecuación de Clínica Andes (prototipo PLAN; "En revisión" → in_progress)
insert into public.remediation_items
  (id, company_id, title, solution_id, responsible, due_date, status)
values
  ('40000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001',
   'Redactar anexo de contrato para tratamiento biométrico',
   '10000000-0000-4000-8000-000000000003', 'Legal · A. Soto', '2026-07-15', 'in_progress'),
  ('40000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001',
   'Implementar cifrado hash de templates biométricos',
   '10000000-0000-4000-8000-000000000002', 'TI · Infra', '2026-07-30', 'pending'),
  ('40000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001',
   'Aprobar manual del plan de respuesta a incidentes',
   null, 'Dirección', '2026-07-10', 'in_progress'),
  ('40000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001',
   'Ejecutar simulacro de brecha de datos',
   null, 'TI · SecOps', '2026-08-20', 'pending'),
  ('40000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000001',
   'Completar Registro de Actividades de Tratamiento',
   null, 'DPO', '2026-07-25', 'in_progress'),
  ('40000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000001',
   'Actualizar cláusulas con encargados de hosting',
   null, 'Legal', '2026-07-02', 'done'),
  ('40000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000001',
   'Definir matriz de plazos de retención',
   null, 'DPO', '2026-08-12', 'pending')
on conflict (id) do update set
  title = excluded.title,
  solution_id = excluded.solution_id,
  responsible = excluded.responsible,
  due_date = excluded.due_date,
  status = excluded.status;

-- Repositorio documental de Clínica Andes (prototipo EVIDENCES).
-- Códigos obsoletos mapeados (analysis §4.3.1): GOV-002→RES-002, GOV-001→RES-001,
-- DAT-001→INV-001, SEC-001→SEG-001, THD-001→TER-001, SEC-002→SEG-002,
-- RGT-001→DER-001. 'Pendiente' del prototipo → 'partial' (en revisión).
-- Formulario_ARSOP_web.png renombrado a ARCOP. -- pendiente validación abogado
-- Recordatorio del mapeo UI: las evidencias requeridas que no aparecen acá
-- (p.ej. las de DPC-EIA-001) se muestran como 'faltante' — no llevan fila.
insert into public.evidences
  (id, company_id, control_id, name, storage_path, version, status, created_at)
values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001',
   (select id from public.controls where code = 'DPC-RES-002'),
   'Politica_Tratamiento_v3.pdf',
   'evidences/20000000-0000-4000-8000-000000000001/Politica_Tratamiento_v3.pdf',
   3, 'validated', '2026-06-12'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001',
   (select id from public.controls where code = 'DPC-RES-001'),
   'Acta_Nombramiento_DPD.pdf',
   'evidences/20000000-0000-4000-8000-000000000001/Acta_Nombramiento_DPD.pdf',
   1, 'validated', '2026-06-10'),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001',
   (select id from public.controls where code = 'DPC-INV-001'),
   'Matriz_RAT_procesos.xlsx',
   'evidences/20000000-0000-4000-8000-000000000001/Matriz_RAT_procesos.xlsx',
   1, 'partial', '2026-06-18'),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001',
   (select id from public.controls where code = 'DPC-SEG-001'),
   'Logs_auditoria_Q2.csv',
   'evidences/20000000-0000-4000-8000-000000000001/Logs_auditoria_Q2.csv',
   1, 'partial', '2026-06-20'),
  ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000001',
   (select id from public.controls where code = 'DPC-TER-001'),
   'Contrato_Encargado_Hosting.pdf',
   'evidences/20000000-0000-4000-8000-000000000001/Contrato_Encargado_Hosting.pdf',
   1, 'rejected', '2026-06-05'),
  -- v2 del contrato de hosting: la v1 fue rechazada y el ítem del plan
  -- "Actualizar cláusulas con encargados de hosting" está 'done'; sin esta
  -- fila, DPC-TER-001 'compliant' no tendría evidencia válida que lo sustente.
  ('30000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000001',
   (select id from public.controls where code = 'DPC-TER-001'),
   'Contrato_Encargado_Hosting_v2.pdf',
   'evidences/20000000-0000-4000-8000-000000000001/Contrato_Encargado_Hosting_v2.pdf',
   2, 'validated', '2026-06-26'),
  ('30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000001',
   (select id from public.controls where code = 'DPC-SEG-002'),
   'Config_MFA_corporativa.pdf',
   'evidences/20000000-0000-4000-8000-000000000001/Config_MFA_corporativa.pdf',
   1, 'validated', '2026-06-14'),
  ('30000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000001',
   (select id from public.controls where code = 'DPC-DER-001'),
   'Formulario_ARCOP_web.png',
   'evidences/20000000-0000-4000-8000-000000000001/Formulario_ARCOP_web.png',
   1, 'validated', '2026-06-09')
on conflict (id) do update set
  control_id = excluded.control_id,
  name = excluded.name,
  storage_path = excluded.storage_path,
  version = excluded.version,
  status = excluded.status;

-- Certificados demo (hashes ficticios).
-- Los códigos llevan sufijo ALEATORIO no adivinable (nada de correlativos
-- 1001, 1002…): la ruta pública de verificación no debe permitir enumerar
-- certificados. La generación real en la app (Fase C) debe usar un componente
-- aleatorio criptográfico (p.ej. 6+ caracteres base32) y rate limit en la
-- ruta pública de verificación.
insert into public.certificates
  (company_id, code, status, issued_at, valid_until, revalidated_at, sha256_hash)
values
  ('20000000-0000-4000-8000-000000000001', 'DPC-CA-2026-X7K4QZ', 'active',
   '2026-06-28', '2027-06-28', null,
   'a3f9c72e1d84b6a3f9c72e1d84b6a3f9c72e1d84b6a3f9c72e1d84b6a3f9c72e'),
  ('20000000-0000-4000-8000-000000000004', 'DPC-NX-2026-M3P8VW', 'active',
   '2025-06-15', '2027-06-20', '2026-06-20',
   '1d84b6a3f9c72e1d84b6a3f9c72e1d84b6a3f9c72e1d84b6a3f9c72e1d84b6a3')
on conflict (code) do update set
  company_id = excluded.company_id,
  status = excluded.status,
  issued_at = excluded.issued_at,
  valid_until = excluded.valid_until,
  revalidated_at = excluded.revalidated_at,
  sha256_hash = excluded.sha256_hash;

commit;
-- ============================================================================
-- FIN DEMO DATA
-- ============================================================================
