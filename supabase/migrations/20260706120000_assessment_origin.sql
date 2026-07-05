alter table public.assessments
  add column if not exists origin text not null default 'consultant'
  check (origin in ('consultant', 'client_recert'));

comment on column public.assessments.origin is
  'Origen del ciclo de evaluación: ''consultant'' (creado por el equipo consultor, default) o ''client_recert'' (ciclo abierto por el cliente al solicitar re-certificación desde el portal).';
