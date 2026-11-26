-- RLS checks for the M4 schema (supabase/migrations/20261126000000_v1_content_schema.sql). One transaction, rolled back.
-- Any failed check raises an exception naming it; no error means every check passed.
-- Run: node scripts/ops/staging-sql.mjs test scripts/sql/rls-v1-content-tests.sql  (staging only, never production)
begin;

-- ── Fixtures (as the migration owner) ──
insert into auth.users (id, aud, role, email) values
  ('a1111111-0000-4000-8000-00000000000a', 'authenticated', 'authenticated', 'rls-a@example.test'),
  ('b2222222-0000-4000-8000-00000000000b', 'authenticated', 'authenticated', 'rls-b@example.test');
insert into public.catalog_problems (id, slug, title, difficulty, statement_md, is_pro, pool) values
  ('00000000-0000-4000-8000-0000000000f1', 'rls-free', 'RLS Free', 'Easy', 'free statement', false, 'public'),
  ('00000000-0000-4000-8000-0000000000f2', 'rls-pro', 'RLS Pro', 'Medium', 'pro statement', true, 'public'),
  ('00000000-0000-4000-8000-0000000000f3', 'rls-room', 'RLS Room', 'Hard', 'room statement', false, 'room');
insert into public.problem_languages (problem_id, lang, starter_code, harness_code, time_limit_ms, max_total_ms, memory_kb) values
  ('00000000-0000-4000-8000-0000000000f1', 'python', 'class Solution: pass', 'SECRET HARNESS', 1000, 10000, 262144);
insert into public.test_cases (problem_id, position, input, expected_output, is_hidden) values
  ('00000000-0000-4000-8000-0000000000f1', 1, '[1]', '1', false),
  ('00000000-0000-4000-8000-0000000000f1', 2, '[2]', '2', true),
  ('00000000-0000-4000-8000-0000000000f3', 1, '[3]', '3', false);
insert into public.hints (problem_id, position, body_md) values
  ('00000000-0000-4000-8000-0000000000f1', 1, 'free hint'),
  ('00000000-0000-4000-8000-0000000000f2', 1, 'pro hint');
insert into public.editorials (problem_id, body_md) values ('00000000-0000-4000-8000-0000000000f1', 'editorial');
insert into public.companies (id, slug, name) values ('00000000-0000-4000-8000-0000000000c1', 'rls-co', 'RLS Co');
insert into public.problem_companies (problem_id, company_id, timeframe, frequency) values
  ('00000000-0000-4000-8000-0000000000f1', '00000000-0000-4000-8000-0000000000c1', 'all', 5),
  ('00000000-0000-4000-8000-0000000000f1', '00000000-0000-4000-8000-0000000000c1', '30', 2);
insert into public.submissions (user_id, problem_id, lang, code, mode) values
  ('a1111111-0000-4000-8000-00000000000a', '00000000-0000-4000-8000-0000000000f1', 'python', 'a code', 'submit'),
  ('b2222222-0000-4000-8000-00000000000b', '00000000-0000-4000-8000-0000000000f1', 'python', 'b code', 'submit');

-- ── Anonymous visitor ──
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$ begin
  if (select count(*) from public.test_cases where is_hidden) <> 0 then raise exception 'FAIL anon: hidden test cases readable'; end if;
  if (select count(*) from public.test_cases where problem_id::text like '00000000-0000-4000-8000-0000000000f%') <> 1 then raise exception 'FAIL anon: expected only the public case of a public problem'; end if;
  if exists (select 1 from public.catalog_problems where pool = 'room') then raise exception 'FAIL anon: room-pool problem visible'; end if;
  if (select count(*) from public.catalog_problems where slug like 'rls-%') <> 2 then raise exception 'FAIL anon: public problems not listed'; end if;
  if exists (select 1 from public.editorials) then raise exception 'FAIL anon: editorial readable without Pro'; end if;
end $$;
do $$ begin perform harness_code from public.problem_languages; raise exception 'FAIL anon: harness_code readable';
exception when insufficient_privilege then null; end $$;
do $$ begin perform 1 from public.submissions; raise exception 'FAIL anon: submissions readable';
exception when insufficient_privilege then null; end $$;

-- ── Signed-in user A, no Pro ──
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1111111-0000-4000-8000-00000000000a","role":"authenticated"}', true);
do $$ begin
  if (select count(*) from public.test_cases where is_hidden) <> 0 then raise exception 'FAIL user: hidden test cases readable'; end if;
  if (select count(*) from public.submissions) <> 1 then raise exception 'FAIL user: should see exactly one (own) submission'; end if;
  if exists (select 1 from public.submissions where user_id <> auth.uid()) then raise exception 'FAIL user: another user''s submission readable'; end if;
  if exists (select 1 from public.editorials) then raise exception 'FAIL user: editorial readable without Pro'; end if;
  if exists (select 1 from public.hints where body_md = 'pro hint') then raise exception 'FAIL user: Pro problem hint readable without Pro'; end if;
  if exists (select 1 from public.problem_companies where timeframe <> 'all') then raise exception 'FAIL user: 30-day frequency readable without Pro'; end if;
  if (select starter_code from public.problem_languages limit 1) is null then raise exception 'FAIL user: starter code not readable'; end if;
end $$;
do $$ begin perform harness_code from public.problem_languages; raise exception 'FAIL user: harness_code readable';
exception when insufficient_privilege then null; end $$;
do $$ begin perform statement_md from public.catalog_problems; raise exception 'FAIL user: statement_md readable from the client';
exception when insufficient_privilege then null; end $$;
do $$ begin perform answer_index from public.quiz_questions; raise exception 'FAIL user: quiz answers readable';
exception when insufficient_privilege then null; end $$;
do $$ begin
  insert into public.submissions (user_id, problem_id, lang, code, mode)
    values (auth.uid(), '00000000-0000-4000-8000-0000000000f1', 'python', 'x', 'submit');
  raise exception 'FAIL user: client can insert submissions';
exception when insufficient_privilege then null; end $$;
do $$ begin update public.test_cases set expected_output = '0'; raise exception 'FAIL user: client can update test cases';
exception when insufficient_privilege then null; end $$;
do $$ begin
  insert into public.notes (user_id, problem_id, body) values (auth.uid(), '00000000-0000-4000-8000-0000000000f1', 'mine');
  if (select count(*) from public.notes) <> 1 then raise exception 'FAIL user: own note not readable'; end if;
end $$;
do $$ begin
  insert into public.notes (user_id, problem_id, body) values ('b2222222-0000-4000-8000-00000000000b', '00000000-0000-4000-8000-0000000000f2', 'forged');
  raise exception 'FAIL user: note inserted for another user';
exception when insufficient_privilege then null; end $$;

-- ── User B cannot see A's rows ──
select set_config('request.jwt.claims', '{"sub":"b2222222-0000-4000-8000-00000000000b","role":"authenticated"}', true);
do $$ begin
  if exists (select 1 from public.notes) then raise exception 'FAIL user B: another user''s note readable'; end if;
  if exists (select 1 from public.submissions where code = 'a code') then raise exception 'FAIL user B: another user''s submission readable'; end if;
end $$;

-- ── User A with an active entitlement ──
reset role;
insert into public.entitlements (user_id, pro_until) values ('a1111111-0000-4000-8000-00000000000a', now() + interval '30 days');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1111111-0000-4000-8000-00000000000a","role":"authenticated"}', true);
do $$ begin
  if not exists (select 1 from public.editorials) then raise exception 'FAIL pro: editorial not readable with Pro'; end if;
  if not exists (select 1 from public.hints where body_md = 'pro hint') then raise exception 'FAIL pro: Pro hint not readable with Pro'; end if;
  if not exists (select 1 from public.problem_companies where timeframe = '30') then raise exception 'FAIL pro: 30-day frequency not readable with Pro'; end if;
  if (select count(*) from public.test_cases where is_hidden) <> 0 then raise exception 'FAIL pro: hidden test cases readable with Pro'; end if;
end $$;
do $$ begin perform harness_code from public.problem_languages; raise exception 'FAIL pro: harness_code readable with Pro';
exception when insufficient_privilege then null; end $$;

-- ── Service role (the judge worker) reads everything ──
reset role;
set local role service_role;
do $$ begin
  if (select count(*) from public.test_cases where is_hidden and problem_id::text like '00000000-0000-4000-8000-0000000000f%') <> 1 then raise exception 'FAIL service: hidden test case not readable'; end if;
  if (select harness_code from public.problem_languages limit 1) <> 'SECRET HARNESS' then raise exception 'FAIL service: harness not readable'; end if;
  if (select count(*) from public.submissions where problem_id::text like '00000000-0000-4000-8000-0000000000f%') <> 2 then raise exception 'FAIL service: submissions not readable'; end if;
end $$;

reset role;
rollback;
