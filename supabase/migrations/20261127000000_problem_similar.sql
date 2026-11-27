-- M8: links a metadata-only LeetCode/GFG row to the Algogym original that practises the same idea
-- ("Similar Algogym problem" on the problems list). Additive: a new table. Written by the seed from meta.json similar_to.
create table public.problem_similar (
  original_id uuid not null references public.catalog_problems(id) on delete cascade,
  similar_id uuid not null references public.catalog_problems(id) on delete cascade,
  primary key (original_id, similar_id),
  check (original_id <> similar_id)
);
create index problem_similar_similar_idx on public.problem_similar (similar_id);

alter table public.problem_similar enable row level security;
revoke all on table public.problem_similar from anon, authenticated;
grant all on table public.problem_similar to service_role;
grant select on table public.problem_similar to anon, authenticated;
create policy "visible problems" on public.problem_similar for select to anon, authenticated
  using (exists (select 1 from public.catalog_problems p where p.id = original_id)
    and exists (select 1 from public.catalog_problems p where p.id = similar_id));
