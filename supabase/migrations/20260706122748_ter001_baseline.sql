-- Contratos con encargados del tratamiento (DPC-TER-001): pasa de condicional
-- (factor 'critical_providers') a BASELINE (aplica siempre). El acuerdo por
-- escrito con encargados es una obligación legal no negociable para toda
-- empresa que use terceros (casi todas: nube, hosting, contador, RRHH). Si no
-- lo tiene, es un gap a mitigar, no un "no aplica". Cuando una empresa
-- genuinamente no tiene encargados, el consultor lo marca "No aplica" con
-- justificación (override de aplicabilidad en answers.applicability).
update public.controls set applies_when = null where code = 'DPC-TER-001';
