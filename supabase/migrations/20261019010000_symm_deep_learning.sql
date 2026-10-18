-- Extend existing private Symm courses without rewriting prior content or progress.
alter table public.ai_learning_paths
  add column preferred_language text not null default 'cpp'
    check (preferred_language in ('cpp','java','python')),
  add column prompt_version integer not null default 1;

create table public.ai_lesson_code_variants (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.ai_learning_lessons(id) on delete cascade,
  language text not null check (language in ('cpp','java','python')),
  code_content text not null check (length(code_content) between 10 and 16000),
  explanation text not null check (length(explanation) between 30 and 12000),
  generation_version integer not null default 1,
  created_at timestamptz not null default now(),
  unique (lesson_id,language,generation_version)
);
create index ai_code_variants_lesson on public.ai_lesson_code_variants(lesson_id,language);
alter table public.ai_lesson_code_variants enable row level security;
create policy ai_own_code_variants on public.ai_lesson_code_variants
  for select to authenticated using (exists (
    select 1 from public.ai_learning_lessons l
    join public.ai_learning_modules m on m.id=l.module_id
    join public.ai_learning_paths p on p.id=m.path_id
    where l.id=lesson_id and p.user_id=(select auth.uid())
  ));
revoke all on public.ai_lesson_code_variants from public,anon,authenticated;
grant select on public.ai_lesson_code_variants to authenticated;
grant all on public.ai_lesson_code_variants to service_role;

create table public.ai_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_type text not null check (resource_type in ('path','lesson','code')),
  resource_id uuid not null,
  idempotency_key text not null,
  status text not null default 'queued' check (status in ('queued','running','completed','failed')),
  stage text not null default 'queued',
  attempt_count integer not null default 0 check (attempt_count between 0 and 5),
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  error_code text,
  unique (user_id,idempotency_key)
);
create index ai_generation_jobs_pending on public.ai_generation_jobs(status,queued_at)
  where status in ('queued','running');
alter table public.ai_generation_jobs enable row level security;
create policy ai_own_generation_jobs on public.ai_generation_jobs
  for select to authenticated using (user_id=(select auth.uid()));
revoke all on public.ai_generation_jobs from public,anon,authenticated;
grant select on public.ai_generation_jobs to authenticated;
grant all on public.ai_generation_jobs to service_role;
