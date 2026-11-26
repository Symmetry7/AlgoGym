-- M4: v1.0 content and practice schema (docs/SYSTEM_ARCHITECTURE.md §5).
-- ADDITIVE ONLY until launch: the legacy app (release/legacy) shares this database. Nothing existing is altered.
-- The legacy `problems` table (LeetCode/Codeforces sync catalog) stays as is; v1.0 problems live in `catalog_problems`.
--
-- Access model: the server (service role, bypasses RLS) does every write. anon/authenticated get explicit grants only:
--   * content: read through RLS; room-pool problems are never visible
--   * hidden test cases, harness_code, statement_md, quiz answers: no client grant at all (service role only)
--   * editorials, Pro study plans and 30/60/90-day company frequency: need an active entitlement
--   * per-user rows: owner only; submissions are owner-only SELECT (this is what makes Realtime safe)

-- ── Content ────────────────────────────────────────────────────────────────────────────────

create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  status text not null default 'soon' check (status in ('live', 'soon')),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.roadmap_layers (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks(id) on delete cascade,
  position integer not null,
  name text not null,
  unique (track_id, position)
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  layer_id uuid not null references public.roadmap_layers(id) on delete cascade,
  position integer not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  icon_url text,
  lesson_path text,
  free_ratio numeric(3, 2) not null default 0.70 check (free_ratio between 0 and 1),
  unique (layer_id, position)
);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  position integer not null,
  question text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array'),
  answer_index integer not null check (answer_index >= 0),
  why text,
  unique (topic_id, position)
);

create table public.catalog_problems (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  number integer unique,
  title text not null,
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  category text not null default 'dsa' check (category in ('dsa', 'sql', 'system-design', 'hr')),
  statement_md text,
  constraints jsonb,
  signature jsonb,
  source text not null default 'algogym' check (source in ('algogym', 'leetcode', 'gfg')),
  source_ref text,
  source_url text,
  status text not null default 'original' check (status in ('original', 'adapted', 'pending')),
  pool text not null default 'public' check (pool in ('public', 'room')),
  is_pro boolean not null default false,
  comparator text not null default 'exact' check (comparator in ('exact', 'float_tolerance', 'unordered')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, source_ref),
  -- LeetCode/GFG rows are metadata only until adapted (docs/DECISIONS.md 2026-11-24).
  constraint catalog_problems_pending_has_no_statement check (status <> 'pending' or statement_md is null),
  constraint catalog_problems_originals_are_algogym check ((status = 'original') = (source = 'algogym'))
);

create table public.topic_problems (
  topic_id uuid not null references public.topics(id) on delete cascade,
  problem_id uuid not null references public.catalog_problems(id) on delete cascade,
  position integer not null,
  primary key (topic_id, problem_id)
);
create index topic_problems_problem_idx on public.topic_problems (problem_id);

create table public.patterns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null
);
create table public.problem_patterns (
  problem_id uuid not null references public.catalog_problems(id) on delete cascade,
  pattern_id uuid not null references public.patterns(id) on delete cascade,
  primary key (problem_id, pattern_id)
);
create index problem_patterns_pattern_idx on public.problem_patterns (pattern_id);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null
);
create table public.problem_tags (
  problem_id uuid not null references public.catalog_problems(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (problem_id, tag_id)
);
create index problem_tags_tag_idx on public.problem_tags (tag_id);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  logo_url text
);
create table public.problem_companies (
  problem_id uuid not null references public.catalog_problems(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  timeframe text not null check (timeframe in ('30', '60', '90', 'all')),
  frequency numeric not null default 0,
  primary key (problem_id, company_id, timeframe)
);
create index problem_companies_company_idx on public.problem_companies (company_id, timeframe);

create table public.problem_languages (
  problem_id uuid not null references public.catalog_problems(id) on delete cascade,
  lang text not null check (lang in ('javascript', 'python', 'cpp', 'java')),
  starter_code text not null,
  harness_code text not null,
  time_limit_ms integer not null check (time_limit_ms > 0),
  max_total_ms integer not null check (max_total_ms > 0),
  memory_kb integer not null check (memory_kb > 0),
  primary key (problem_id, lang)
);

create table public.test_cases (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.catalog_problems(id) on delete cascade,
  position integer not null,
  input jsonb not null,
  expected_output jsonb not null,
  is_hidden boolean not null default true,
  explain_md text,
  unique (problem_id, position)
);

create table public.hints (
  problem_id uuid not null references public.catalog_problems(id) on delete cascade,
  position integer not null,
  body_md text not null,
  primary key (problem_id, position)
);

create table public.editorials (
  problem_id uuid primary key references public.catalog_problems(id) on delete cascade,
  body_md text not null,
  solutions jsonb not null default '{}'::jsonb
);

create table public.daily_problems (
  date date primary key,
  problem_id uuid not null references public.catalog_problems(id) on delete cascade
);

create table public.study_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  summary text,
  is_pro boolean not null default false,
  position integer not null default 0
);
create table public.study_plan_items (
  plan_id uuid not null references public.study_plans(id) on delete cascade,
  problem_id uuid not null references public.catalog_problems(id) on delete cascade,
  module text,
  position integer not null,
  primary key (plan_id, problem_id)
);

create table public.interview_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('hr', 'sql')),
  question text not null,
  answer_md text,
  companies text[] not null default '{}',
  roles text[] not null default '{}',
  -- Where M6 copied the row from, so the migration is idempotent and counts can be checked.
  source_table text,
  source_id text,
  created_at timestamptz not null default now(),
  unique (source_table, source_id)
);

-- ── Per user ───────────────────────────────────────────────────────────────────────────────

create table public.entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pro_until timestamptz,
  source text,
  updated_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id uuid not null references public.catalog_problems(id) on delete cascade,
  lang text not null check (lang in ('javascript', 'python', 'cpp', 'java')),
  code text not null,
  mode text not null check (mode in ('run', 'submit')),
  context text not null default 'practice' check (context in ('practice', 'room')),
  status text not null default 'queued' check (status in ('queued', 'running', 'done', 'error')),
  verdict text,
  -- Hidden cases: case number, verdict and runtime only, never input or output (docs/DECISIONS.md 2026-11-24).
  results jsonb,
  runtime_ms integer,
  memory_kb integer,
  created_at timestamptz not null default now()
);
create index submissions_user_problem_idx on public.submissions (user_id, problem_id, created_at desc);
create index submissions_problem_idx on public.submissions (problem_id);

create table public.user_problem_status (
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id uuid not null references public.catalog_problems(id) on delete cascade,
  status text not null check (status in ('attempted', 'solved')),
  solved_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, problem_id)
);
create index user_problem_status_problem_idx on public.user_problem_status (problem_id, status);

create table public.user_topic_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  lesson_read_at timestamptz,
  quiz_passed_at timestamptz,
  completed_at timestamptz,
  primary key (user_id, topic_id)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id uuid not null references public.catalog_problems(id) on delete cascade,
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, problem_id)
);

create table public.bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id uuid not null references public.catalog_problems(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, problem_id)
);

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(name) between 1 and 80),
  created_at timestamptz not null default now()
);
create index lists_user_idx on public.lists (user_id);
create table public.list_items (
  list_id uuid not null references public.lists(id) on delete cascade,
  problem_id uuid not null references public.catalog_problems(id) on delete cascade,
  position integer not null default 0,
  added_at timestamptz not null default now(),
  primary key (list_id, problem_id)
);

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  user_id uuid references auth.users(id) on delete set null,
  feature text not null check (feature in ('arena')),
  created_at timestamptz not null default now()
);
create unique index waitlist_feature_email_idx on public.waitlist (feature, lower(email));

-- ── Entitlement check ──────────────────────────────────────────────────────────────────────

create function public.has_pro_entitlement() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.entitlements e where e.user_id = (select auth.uid()) and e.pro_until > now());
$$;
revoke all on function public.has_pro_entitlement() from public;
grant execute on function public.has_pro_entitlement() to anon, authenticated, service_role;

-- ── Grants: nothing by default, then exactly what clients may touch ────────────────────────

do $$
declare t text;
begin
  foreach t in array array['tracks','roadmap_layers','topics','quiz_questions','catalog_problems','topic_problems','patterns',
    'problem_patterns','tags','problem_tags','companies','problem_companies','problem_languages','test_cases','hints','editorials',
    'daily_problems','study_plans','study_plan_items','interview_items','entitlements','submissions','user_problem_status',
    'user_topic_progress','notes','bookmarks','lists','list_items','waitlist']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant all on table public.%I to service_role', t);
  end loop;
end $$;

-- Public content: whole rows.
grant select on public.tracks, public.roadmap_layers, public.topics, public.topic_problems, public.patterns, public.problem_patterns,
  public.tags, public.problem_tags, public.companies, public.problem_companies, public.hints, public.editorials,
  public.daily_problems, public.study_plans, public.study_plan_items, public.interview_items, public.test_cases
  to anon, authenticated;
-- Column grants keep server-only columns out of every client query.
grant select (id, slug, number, title, difficulty, category, constraints, signature, source, source_ref, source_url, status, pool,
  is_pro, comparator, created_at, updated_at) on public.catalog_problems to anon, authenticated;
grant select (problem_id, lang, starter_code, time_limit_ms, max_total_ms, memory_kb) on public.problem_languages to anon, authenticated;
grant select (id, topic_id, position, question, options) on public.quiz_questions to anon, authenticated;
-- Per user.
grant select on public.entitlements, public.submissions, public.user_problem_status, public.user_topic_progress, public.waitlist to authenticated;
grant select, insert, update, delete on public.notes, public.bookmarks, public.lists, public.list_items to authenticated;

-- ── Policies ───────────────────────────────────────────────────────────────────────────────

create policy "content is public" on public.tracks for select to anon, authenticated using (true);
create policy "content is public" on public.roadmap_layers for select to anon, authenticated using (true);
create policy "content is public" on public.topics for select to anon, authenticated using (true);
create policy "content is public" on public.quiz_questions for select to anon, authenticated using (true);
create policy "content is public" on public.patterns for select to anon, authenticated using (true);
create policy "content is public" on public.tags for select to anon, authenticated using (true);
create policy "content is public" on public.companies for select to anon, authenticated using (true);
create policy "content is public" on public.interview_items for select to anon, authenticated using (true);
create policy "free plans, or Pro" on public.study_plans for select to anon, authenticated
  using (not is_pro or (select public.has_pro_entitlement()));

-- Room-pool problems never reach practice clients. Child tables re-check through catalog_problems' own policy.
create policy "public pool only" on public.catalog_problems for select to anon, authenticated using (pool = 'public');
create policy "visible problems" on public.topic_problems for select to anon, authenticated
  using (exists (select 1 from public.catalog_problems p where p.id = problem_id));
create policy "visible problems" on public.problem_patterns for select to anon, authenticated
  using (exists (select 1 from public.catalog_problems p where p.id = problem_id));
create policy "visible problems" on public.problem_tags for select to anon, authenticated
  using (exists (select 1 from public.catalog_problems p where p.id = problem_id));
create policy "visible problems" on public.daily_problems for select to anon, authenticated
  using (exists (select 1 from public.catalog_problems p where p.id = problem_id));
create policy "visible problems" on public.problem_languages for select to anon, authenticated
  using (exists (select 1 from public.catalog_problems p where p.id = problem_id));
create policy "all-time for everyone, 30/60/90 days for Pro" on public.problem_companies for select to anon, authenticated
  using (exists (select 1 from public.catalog_problems p where p.id = problem_id)
    and (timeframe = 'all' or (select public.has_pro_entitlement())));
-- Hidden rows have no policy: only the service role (the judge worker) reads them.
create policy "public cases of visible problems" on public.test_cases for select to anon, authenticated
  using (not is_hidden and exists (select 1 from public.catalog_problems p where p.id = problem_id));
create policy "hints of free problems, or Pro" on public.hints for select to anon, authenticated
  using (exists (select 1 from public.catalog_problems p where p.id = problem_id and (not p.is_pro or (select public.has_pro_entitlement()))));
create policy "Pro only" on public.editorials for select to anon, authenticated
  using ((select public.has_pro_entitlement()) and exists (select 1 from public.catalog_problems p where p.id = problem_id));
create policy "items of visible plans" on public.study_plan_items for select to anon, authenticated
  using (exists (select 1 from public.study_plans s where s.id = plan_id)
    and exists (select 1 from public.catalog_problems p where p.id = problem_id));

create policy "own rows" on public.entitlements for select to authenticated using (user_id = (select auth.uid()));
create policy "own rows" on public.submissions for select to authenticated using (user_id = (select auth.uid()));
create policy "own rows" on public.user_problem_status for select to authenticated using (user_id = (select auth.uid()));
create policy "own rows" on public.user_topic_progress for select to authenticated using (user_id = (select auth.uid()));
create policy "own rows" on public.waitlist for select to authenticated using (user_id = (select auth.uid()));
create policy "own rows" on public.notes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.bookmarks for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.lists for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "items of own lists" on public.list_items for all to authenticated
  using (exists (select 1 from public.lists l where l.id = list_id and l.user_id = (select auth.uid())))
  with check (exists (select 1 from public.lists l where l.id = list_id and l.user_id = (select auth.uid())));

-- Realtime pushes submission status to its owner; the owner-only SELECT policy above is what scopes it.
alter publication supabase_realtime add table public.submissions;
