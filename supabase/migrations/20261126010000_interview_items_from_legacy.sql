-- M6: copy the legacy HR and SQL interview content into interview_items (docs/BUILD_GUIDE.md M6).
-- Additive: new columns on interview_items (an M4 table no legacy code reads) and an upsert. Legacy tables are only read.
-- Idempotent: rows are keyed by (source_table, source_id), so re-running refreshes them and never duplicates.

alter table public.interview_items
  add column tags text[] not null default '{}',
  add column difficulty text check (difficulty in ('Easy', 'Medium', 'Hard')),
  add column reference_url text,
  add column position integer not null default 0;

create index interview_items_kind_position_idx on public.interview_items (kind, position);

-- HR: the "hr-questions" category (Algogym's own example answers). SQL: the "sql" category (one MySQL 8 query each).
insert into public.interview_items (kind, question, answer_md, tags, difficulty, reference_url, position, source_table, source_id)
select
  case cq.category_slug when 'hr-questions' then 'hr' else 'sql' end,
  q.title,
  case
    when cq.category_slug = 'hr-questions' then nullif(c.answer_text, '')
    when nullif(c.answer_code, '') is not null then E'```sql\n' || c.answer_code || E'\n```'
  end,
  -- Every SQL row is tagged "SQL"; the kind already says that.
  coalesce(array_remove(q.tags, 'SQL'), '{}'),
  q.difficulty,
  q.url,
  cq.position,
  'interview_questions',
  q.id
from public.interview_category_questions cq
join public.interview_questions q on q.id = cq.question_id
left join public.interview_question_content c on c.question_id = q.id
where cq.category_slug in ('hr-questions', 'sql') and q.published
on conflict (source_table, source_id) do update set
  kind = excluded.kind,
  question = excluded.question,
  answer_md = excluded.answer_md,
  tags = excluded.tags,
  difficulty = excluded.difficulty,
  reference_url = excluded.reference_url,
  position = excluded.position;
