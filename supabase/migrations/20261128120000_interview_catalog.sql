-- Interview question catalog: hynts.in's public question lists as metadata only (titles, sheet, difficulty, position),
-- written by scripts/data/import-hynts.mjs (docs/DECISIONS.md 2026-11-28). No answers or explanations are stored.
-- Additive: two new tables. interview_items keeps its ('hr', 'sql') kind check, which can't be widened without dropping it.
-- provenance_url keeps where a row was observed; no client role can select it, so the UI can never link out with it.

create table public.interview_sheets (
  section text not null check (section in ('company', 'dsa-sheet', 'pattern', 'role', 'topic', 'sql', 'hr', 'system-design')),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  group_name text,
  -- Study-plan tracks: system-design, sql-database, hr-behavioural, cs-fundamentals, interview-prep, frontend, backend, ai-llm, dsa.
  tracks text[] not null default '{}',
  position integer not null default 0,
  item_count integer not null default 0,
  provenance_url text,
  observed_at date not null,
  primary key (section, slug)
);

create table public.interview_catalog (
  id uuid primary key default gen_random_uuid(),
  -- '<section>/<sheet>/<title key>[#n]': stable when the source reorders a sheet, so re-imports update instead of duplicating.
  source_key text not null unique,
  section text not null,
  sheet_slug text not null,
  position integer not null,
  title text not null,
  difficulty text check (difficulty in ('Easy', 'Medium', 'Hard')),
  category text,
  subcategory text,
  level text check (level in ('HLD', 'LLD')),
  platform text,
  tags text[] not null default '{}',
  tracks text[] not null default '{}',
  companies text[] not null default '{}',
  roles text[] not null default '{}',
  -- The catalog problem this question is (a lc-/gfg- metadata row or an original), and the Algogym original to practise it with.
  problem_id uuid references public.catalog_problems(id) on delete set null,
  practice_problem_id uuid references public.catalog_problems(id) on delete set null,
  -- The Algogym-written HR or SQL item with an answer, when this question is one of them.
  interview_item_id uuid references public.interview_items(id) on delete set null,
  provenance_url text,
  observed_at date not null,
  foreign key (section, sheet_slug) references public.interview_sheets(section, slug) on delete cascade
);
create index interview_catalog_sheet_idx on public.interview_catalog (section, sheet_slug, position);
create index interview_catalog_tracks_idx on public.interview_catalog using gin (tracks);
create index interview_catalog_problem_idx on public.interview_catalog (problem_id);
create index interview_catalog_practice_idx on public.interview_catalog (practice_problem_id);
create index interview_catalog_item_idx on public.interview_catalog (interview_item_id);

alter table public.interview_sheets enable row level security;
alter table public.interview_catalog enable row level security;
revoke all on table public.interview_sheets, public.interview_catalog from anon, authenticated;
grant all on table public.interview_sheets, public.interview_catalog to service_role;
-- Column grants: every column except provenance_url.
grant select (section, slug, title, group_name, tracks, position, item_count, observed_at) on public.interview_sheets to anon, authenticated;
grant select (id, source_key, section, sheet_slug, position, title, difficulty, category, subcategory, level, platform, tags, tracks,
  companies, roles, problem_id, practice_problem_id, interview_item_id, observed_at) on public.interview_catalog to anon, authenticated;
create policy "content is public" on public.interview_sheets for select to anon, authenticated using (true);
create policy "content is public" on public.interview_catalog for select to anon, authenticated using (true);
