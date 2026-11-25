-- Generation requests are server-owned. Cached answers use interview_question_content.
create table if not exists public.interview_answer_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.interview_questions(id) on delete cascade,
  requested_at timestamptz not null default now()
);
create index if not exists interview_answer_requests_user_time_idx
  on public.interview_answer_requests(user_id, requested_at desc);
alter table public.interview_answer_requests enable row level security;
revoke all on public.interview_answer_requests from anon, authenticated;
