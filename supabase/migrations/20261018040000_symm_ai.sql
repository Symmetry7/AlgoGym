-- Symm AI is private learning state. The existing problems, solves and Chakra ledger remain authoritative.
create table public.ai_learning_paths (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  topic text not null check (length(topic) between 3 and 180),
  title text not null,
  description text not null default '',
  level text not null check (level in ('beginner','intermediate','advanced')),
  goal text not null check (goal in ('fundamentals','interview','competitive','mastery')),
  hours_per_week integer not null check (hours_per_week between 1 and 40),
  category text not null default 'general' check (category in ('general','competitive')),
  objectives text[] not null default '{}',
  prerequisites text[] not null default '{}',
  estimated_minutes integer not null default 0 check (estimated_minutes between 0 and 20000),
  status text not null default 'generating' check (status in ('generating','ready','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,request_id)
);
create index ai_paths_owner_recent on public.ai_learning_paths(user_id,created_at desc);

create table public.ai_learning_modules (
  id uuid primary key default gen_random_uuid(),
  path_id uuid not null references public.ai_learning_paths(id) on delete cascade,
  position integer not null check (position between 0 and 19),
  title text not null,
  description text not null default '',
  objectives text[] not null default '{}',
  tags text[] not null default '{}',
  estimated_minutes integer not null default 0 check (estimated_minutes between 0 and 2000),
  unique(path_id,position)
);
create index ai_modules_path on public.ai_learning_modules(path_id,position);

create table public.ai_learning_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.ai_learning_modules(id) on delete cascade,
  position integer not null check (position between 0 and 9),
  title text not null,
  objectives text[] not null default '{}',
  content jsonb,
  status text not null default 'pending' check (status in ('pending','generating','ready','failed')),
  generation_started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(module_id,position)
);
create index ai_lessons_module on public.ai_learning_lessons(module_id,position);

create table public.ai_learning_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.ai_learning_lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key(user_id,lesson_id)
);

create table public.ai_learning_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.ai_learning_lessons(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  message text not null check (length(message) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index ai_conversation_lesson_user on public.ai_learning_conversations(user_id,lesson_id,created_at desc);

create table public.ai_recommended_problems (
  module_id uuid not null references public.ai_learning_modules(id) on delete cascade,
  problem_id uuid not null references public.problems(id) on delete cascade,
  position integer not null check (position between 0 and 19),
  primary key(module_id,problem_id),
  unique(module_id,position)
);

create table public.ai_generation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('path','lesson','tutor')),
  created_at timestamptz not null default now()
);
create index ai_generation_quota on public.ai_generation_events(user_id,kind,created_at desc);

alter table public.ai_learning_paths enable row level security;
alter table public.ai_learning_modules enable row level security;
alter table public.ai_learning_lessons enable row level security;
alter table public.ai_learning_progress enable row level security;
alter table public.ai_learning_conversations enable row level security;
alter table public.ai_recommended_problems enable row level security;
alter table public.ai_generation_events enable row level security;

create policy ai_own_paths on public.ai_learning_paths for select to authenticated using (user_id=(select auth.uid()));
create policy ai_own_modules on public.ai_learning_modules for select to authenticated using (exists(select 1 from public.ai_learning_paths p where p.id=path_id and p.user_id=(select auth.uid())));
create policy ai_own_lessons on public.ai_learning_lessons for select to authenticated using (exists(select 1 from public.ai_learning_modules m join public.ai_learning_paths p on p.id=m.path_id where m.id=module_id and p.user_id=(select auth.uid())));
create policy ai_own_progress on public.ai_learning_progress for select to authenticated using (user_id=(select auth.uid()));
create policy ai_own_conversations on public.ai_learning_conversations for select to authenticated using (user_id=(select auth.uid()) and exists(select 1 from public.ai_learning_lessons l join public.ai_learning_modules m on m.id=l.module_id join public.ai_learning_paths p on p.id=m.path_id where l.id=lesson_id and p.user_id=(select auth.uid())));
create policy ai_own_recommendations on public.ai_recommended_problems for select to authenticated using (exists(select 1 from public.ai_learning_modules m join public.ai_learning_paths p on p.id=m.path_id where m.id=module_id and p.user_id=(select auth.uid())));

revoke all on public.ai_learning_paths,public.ai_learning_modules,public.ai_learning_lessons,public.ai_learning_progress,public.ai_learning_conversations,public.ai_recommended_problems,public.ai_generation_events from public,anon,authenticated;
grant select on public.ai_learning_paths,public.ai_learning_modules,public.ai_learning_lessons,public.ai_learning_progress,public.ai_learning_conversations,public.ai_recommended_problems to authenticated;
grant all on public.ai_learning_paths,public.ai_learning_modules,public.ai_learning_lessons,public.ai_learning_progress,public.ai_learning_conversations,public.ai_recommended_problems,public.ai_generation_events to service_role;

create function public.reserve_symm_generation(p_kind text)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare v_user uuid:=auth.uid(); v_limit integer;
begin
  if v_user is null or p_kind not in ('path','lesson','tutor') then return false; end if;
  v_limit:=case p_kind when 'path' then 8 when 'lesson' then 40 else 120 end;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text||':symm:'||p_kind,0));
  if (select count(*) from public.ai_generation_events where user_id=v_user and kind=p_kind and created_at>now()-interval '1 day')>=v_limit then return false; end if;
  insert into public.ai_generation_events(user_id,kind) values(v_user,p_kind);
  return true;
end;$$;
revoke all on function public.reserve_symm_generation(text) from public,anon,authenticated;
grant execute on function public.reserve_symm_generation(text) to authenticated;
