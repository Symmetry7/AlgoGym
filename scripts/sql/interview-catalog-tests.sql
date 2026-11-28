-- RLS checks for interview_sheets and interview_catalog (migration 20261128120000). Any failure raises; everything rolls back.
-- Run: node scripts/ops/staging-sql.mjs test scripts/sql/interview-catalog-tests.sql  (staging only, never production)
begin;
insert into public.interview_sheets (section, slug, title, provenance_url, observed_at)
  values ('role', 'rls-test-role', 'RLS test', 'https://example.com/hidden', '2026-11-28');
insert into public.interview_catalog (source_key, section, sheet_slug, position, title, provenance_url, observed_at)
  values ('role/rls-test-role/q', 'role', 'rls-test-role', 1, 'RLS test question', 'https://example.com/hidden', '2026-11-28');

do $$ begin
  -- Shape checks that need no role switch.
  begin
    insert into public.interview_sheets (section, slug, title, observed_at) values ('playlist', 'x', 'x', '2026-11-28');
    raise exception 'FAIL: unknown section accepted';
  exception when check_violation then null; end;
  begin
    insert into public.interview_catalog (source_key, section, sheet_slug, position, title, observed_at)
      values ('role/missing/q', 'role', 'missing-sheet', 1, 'x', '2026-11-28');
    raise exception 'FAIL: item without a sheet accepted';
  exception when foreign_key_violation then null; end;
end $$;

-- Anonymous visitors read the content, never the provenance URL, and cannot write.
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$ begin
  if not exists (select 1 from public.interview_catalog where source_key = 'role/rls-test-role/q') then raise exception 'FAIL anon: catalog not readable'; end if;
  perform section, slug, title, group_name, tracks, item_count from public.interview_sheets limit 1;
  perform title, difficulty, tags, tracks, companies, roles, problem_id, practice_problem_id, interview_item_id from public.interview_catalog limit 1;
  begin
    perform provenance_url from public.interview_catalog limit 1;
    raise exception 'FAIL anon: provenance_url readable';
  exception when insufficient_privilege then null; end;
  begin
    perform provenance_url from public.interview_sheets limit 1;
    raise exception 'FAIL anon: sheet provenance_url readable';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.interview_catalog (source_key, section, sheet_slug, position, title, observed_at)
      values ('role/rls-test-role/x', 'role', 'rls-test-role', 2, 'x', '2026-11-28');
    raise exception 'FAIL anon: insert allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- Signed-in users: same read access, still no writes.
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000000"}', true);
do $$ begin
  if not exists (select 1 from public.interview_sheets where slug = 'rls-test-role') then raise exception 'FAIL authenticated: sheets not readable'; end if;
  begin
    update public.interview_catalog set title = 'x' where source_key = 'role/rls-test-role/q';
    raise exception 'FAIL authenticated: update allowed';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.interview_sheets where slug = 'rls-test-role';
    raise exception 'FAIL authenticated: delete allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
