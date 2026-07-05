-- 'alter type ... add value' no admite ir junto a otro DDL en la misma tx,
-- por eso va en una migración aparte.
alter type public.control_result add value if not exists 'not_applicable';
