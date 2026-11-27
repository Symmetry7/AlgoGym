-- M7 checks: company metadata import (scripts/data/import-companies.mjs). Read-only; any failure raises.
-- Run: node scripts/ops/staging-sql.mjs test scripts/sql/company-import-tests.sql  (staging only, never production)
begin;
do $$ begin
  -- The top 30 companies are present, and each has all-time links.
  if (select count(*) from public.companies c where exists (select 1 from public.problem_companies pc where pc.company_id = c.id and pc.timeframe = 'all')) < 30
    then raise exception 'FAIL: fewer than 30 companies with all-time problems'; end if;
  -- Metadata only: LeetCode/GFG rows are pending, carry no statement, signature or tests, and link to the original.
  if exists (select 1 from public.catalog_problems where source in ('leetcode', 'gfg') and (status <> 'pending' or statement_md is not null or signature is not null))
    then raise exception 'FAIL: a LeetCode/GFG row has a statement or is not pending'; end if;
  if exists (select 1 from public.catalog_problems where source = 'leetcode' and (source_url is null or source_url !~ '^https://leetcode\.com/problems/[a-z0-9-]+/$' or slug <> 'lc-' || source_ref))
    then raise exception 'FAIL: a LeetCode row has a bad source_url or slug'; end if;
  if exists (select 1 from public.test_cases t join public.catalog_problems p on p.id = t.problem_id where p.source <> 'algogym')
    then raise exception 'FAIL: test cases stored for a non-Algogym problem'; end if;
  if exists (select 1 from public.problem_languages l join public.catalog_problems p on p.id = l.problem_id where p.source <> 'algogym')
    then raise exception 'FAIL: starter or harness stored for a non-Algogym problem'; end if;
  -- Every 30- and 90-day link has a matching all-time link from the same import.
  if exists (select 1 from public.problem_companies r where r.timeframe in ('30', '90') and not exists
    (select 1 from public.problem_companies a where a.problem_id = r.problem_id and a.company_id = r.company_id and a.timeframe = 'all'))
    then raise exception 'FAIL: a recent-timeframe link has no all-time link'; end if;
end $$;

-- Free visitors see all-time company links but not the 30/90-day ones (Pro), and never a statement.
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$ begin
  if not exists (select 1 from public.problem_companies where timeframe = 'all') then raise exception 'FAIL anon: all-time links not readable'; end if;
  if exists (select 1 from public.problem_companies where timeframe <> 'all') then raise exception 'FAIL anon: 30/90-day links readable without Pro'; end if;
  if not exists (select 1 from public.catalog_problems where source = 'leetcode') then raise exception 'FAIL anon: LeetCode rows not listed'; end if;
end $$;
reset role;
rollback;
