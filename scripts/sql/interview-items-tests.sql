-- M6 checks: interview_items matches the legacy HR and SQL content exactly. Read-only; any failure raises.
-- Run: node scripts/ops/staging-sql.mjs test scripts/sql/interview-items-tests.sql  (staging only, never production)
begin;
do $$
declare
  legacy_hr int; legacy_sql int; items_hr int; items_sql int; missing int; mismatched int;
begin
  select count(*) into legacy_hr from public.interview_category_questions cq join public.interview_questions q on q.id = cq.question_id
    where cq.category_slug = 'hr-questions' and q.published;
  select count(*) into legacy_sql from public.interview_category_questions cq join public.interview_questions q on q.id = cq.question_id
    where cq.category_slug = 'sql' and q.published;
  select count(*) into items_hr from public.interview_items where kind = 'hr';
  select count(*) into items_sql from public.interview_items where kind = 'sql';
  if items_hr <> legacy_hr then raise exception 'FAIL: % HR items, legacy has %', items_hr, legacy_hr; end if;
  if items_sql <> legacy_sql then raise exception 'FAIL: % SQL items, legacy has %', items_sql, legacy_sql; end if;

  -- Every legacy row is present, with the same question text.
  select count(*) into missing from public.interview_category_questions cq join public.interview_questions q on q.id = cq.question_id
    left join public.interview_items i on i.source_table = 'interview_questions' and i.source_id = q.id
    where cq.category_slug in ('hr-questions', 'sql') and q.published and (i.id is null or i.question <> q.title);
  if missing <> 0 then raise exception 'FAIL: % legacy questions missing or changed', missing; end if;

  -- Answers carried over: HR text verbatim, SQL code inside a ```sql fence.
  select count(*) into mismatched from public.interview_items i join public.interview_question_content c on c.question_id = i.source_id
    where (i.kind = 'hr' and i.answer_md is distinct from nullif(c.answer_text, ''))
       or (i.kind = 'sql' and i.answer_md is distinct from E'```sql\n' || c.answer_code || E'\n```');
  if mismatched <> 0 then raise exception 'FAIL: % answers differ from legacy content', mismatched; end if;
  if exists (select 1 from public.interview_items where answer_md is null) then raise exception 'FAIL: an item has no answer'; end if;
end $$;

-- Readable by anonymous visitors, like the legacy section.
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$ begin
  if (select count(*) from public.interview_items) = 0 then raise exception 'FAIL anon: interview items not readable'; end if;
  perform tags, difficulty, reference_url, position from public.interview_items limit 1;
end $$;
reset role;
rollback;
