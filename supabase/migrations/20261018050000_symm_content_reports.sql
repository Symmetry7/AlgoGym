create table public.ai_content_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.ai_learning_lessons(id) on delete cascade,
  reason text not null check (length(reason) between 10 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,lesson_id)
);
create index ai_content_reports_lesson on public.ai_content_reports(lesson_id,created_at desc);
alter table public.ai_content_reports enable row level security;
create policy ai_own_content_reports on public.ai_content_reports for select to authenticated using (user_id=(select auth.uid()));
revoke all on public.ai_content_reports from public,anon,authenticated;
grant select on public.ai_content_reports to authenticated;
grant all on public.ai_content_reports to service_role;
