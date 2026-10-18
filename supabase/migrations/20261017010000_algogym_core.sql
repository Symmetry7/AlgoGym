-- Additive AlgoGym 2.0 data model. Review against the live project backup
-- before applying; service-owned tables are not writable from browser clients.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  username text unique,
  is_public boolean not null default false,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_shape check (username is null or username ~ '^[a-zA-Z0-9_-]{3,30}$')
);

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists public.colleges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  normalized_name text not null unique,
  city text,
  state text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','suspended')),
  created_at timestamptz not null default now()
);
create table if not exists public.college_aliases (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges(id) on delete cascade,
  normalized_alias text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.societies (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges(id) on delete restrict,
  slug text not null,
  name text not null,
  description text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','suspended')),
  created_by uuid not null references auth.users(id) on delete restrict,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (college_id, slug)
);
create table if not exists public.society_applications (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  applicant_id uuid not null references auth.users(id) on delete cascade,
  evidence_path text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','withdrawn')),
  decided_by uuid references auth.users(id) on delete set null,
  decision_reason text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists society_application_one_pending on public.society_applications(society_id, applicant_id) where status = 'pending';
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  society_id uuid not null references public.societies(id) on delete restrict,
  role text not null default 'member' check (role in ('member','moderator','admin')),
  status text not null default 'pending' check (status in ('pending','active','rejected','left','suspended')),
  competitive boolean not null default true,
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index if not exists one_active_competitive_membership on public.memberships(user_id) where status = 'active' and competitive and effective_to is null;
create unique index if not exists membership_one_pending_request on public.memberships(user_id, society_id) where status = 'pending';

create table if not exists public.problems (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('codeforces','leetcode')),
  external_problem_id text not null,
  title text not null,
  url text not null,
  cf_rating integer,
  lc_difficulty text check (lc_difficulty is null or lc_difficulty in ('Easy','Medium','Hard')),
  tags text[] not null default '{}',
  active boolean not null default true,
  last_synced_at timestamptz,
  unique (provider, external_problem_id),
  check ((provider = 'codeforces' and lc_difficulty is null) or (provider = 'leetcode' and cf_rating is null))
);
create table if not exists public.training_lists (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  visibility text not null default 'public' check (visibility in ('private','college','public')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.training_items (
  id uuid primary key default gen_random_uuid(),
  training_list_id uuid not null references public.training_lists(id) on delete cascade,
  problem_id uuid not null references public.problems(id) on delete cascade,
  position integer not null check (position >= 0),
  unique (training_list_id, problem_id),
  unique (training_list_id, position)
);

create table if not exists public.provider_sync_runs (
  id uuid primary key default gen_random_uuid(),
  coding_profile_user_id uuid not null,
  provider text not null check (provider in ('codeforces','leetcode')),
  job_type text not null,
  status text not null check (status in ('queued','running','succeeded','failed','retrying')),
  started_at timestamptz,
  finished_at timestamptz,
  cursor jsonb,
  error_code text,
  created_at timestamptz not null default now(),
  foreign key (coding_profile_user_id, provider) references public.coding_profiles(user_id, platform) on delete cascade
);
create table if not exists public.provider_submissions (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('codeforces','leetcode')),
  provider_submission_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id uuid references public.problems(id) on delete set null,
  verdict text not null,
  submitted_at timestamptz not null,
  fetched_at timestamptz not null default now(),
  unique (provider, provider_submission_id)
);
create table if not exists public.provider_rating_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('codeforces','leetcode')),
  contest_id text not null,
  contest_at timestamptz not null,
  rating_before integer,
  rating_after integer not null,
  unique (user_id, provider, contest_id)
);
create table if not exists public.provider_sync_cursors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('codeforces','leetcode')),
  stream text not null,
  cursor jsonb,
  last_success_at timestamptz,
  unique (user_id, provider, stream)
);

create table if not exists public.solves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id uuid not null references public.problems(id) on delete restrict,
  first_accepted_at timestamptz not null,
  proof_submission_id text not null,
  proof_status text not null check (proof_status in ('pending','verified','rejected')),
  created_at timestamptz not null default now(),
  unique (user_id, problem_id)
);
create table if not exists public.chakra_policies (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  effective_at timestamptz not null,
  cf_brackets jsonb not null,
  lc_difficulty_points jsonb not null default '{}'::jsonb,
  leetcode_awards_enabled boolean not null default false,
  status text not null check (status in ('draft','active','retired')),
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.chakra_awards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  problem_id uuid not null references public.problems(id) on delete restrict,
  solve_id uuid not null references public.solves(id) on delete restrict,
  policy_id uuid not null references public.chakra_policies(id) on delete restrict,
  difficulty_snapshot jsonb not null,
  points integer not null check (points > 0),
  awarded_at timestamptz not null default now(),
  unique (user_id, problem_id),
  unique (solve_id)
);
create table if not exists public.chakra_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  award_id uuid references public.chakra_awards(id) on delete restrict,
  entry_type text not null check (entry_type in ('grant','reversal')),
  delta integer not null check (delta <> 0),
  reason text not null,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (award_id, entry_type)
);
create table if not exists public.outbox_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  aggregate_id uuid not null,
  payload jsonb not null,
  occurred_at timestamptz not null default now(),
  processed_at timestamptz
);
create table if not exists public.chakra_balance_cache (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance bigint not null default 0,
  refreshed_at timestamptz not null default now()
);

create table if not exists public.analytics_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('codeforces','leetcode')),
  day date not null,
  solves_count integer not null default 0 check (solves_count >= 0),
  chakra_earned integer not null default 0 check (chakra_earned >= 0),
  difficulty_breakdown jsonb not null default '{}'::jsonb,
  topic_breakdown jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, provider, day)
);
create table if not exists public.society_analytics_daily (
  society_id uuid not null references public.societies(id) on delete cascade,
  day date not null,
  eligible_members integer not null default 0,
  active_members integer not null default 0,
  solves integer not null default 0,
  chakra bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (society_id, day)
);
create table if not exists public.leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('individual','society','college')),
  metric text not null,
  period_start date,
  period_end date,
  policy_version text,
  computed_at timestamptz not null default now(),
  generation bigint not null default 1
);
create table if not exists public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.leaderboard_snapshots(id) on delete cascade,
  subject_type text not null check (subject_type in ('user','society','college')),
  subject_id uuid not null,
  rank integer not null check (rank > 0),
  score numeric not null,
  eligible_count integer not null default 0,
  secondary_sort jsonb not null default '{}'::jsonb,
  unique (snapshot_id, subject_type, subject_id),
  unique (snapshot_id, subject_type, rank)
);
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  object_type text not null,
  object_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.job_locks (
  job_key text primary key,
  locked_until timestamptz not null,
  attempts integer not null default 0,
  updated_at timestamptz not null default now()
);

create or replace function public.bootstrap_algogym_profile()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created_algogym_profile on auth.users;
create trigger on_auth_user_created_algogym_profile after insert on auth.users
for each row execute function public.bootstrap_algogym_profile();
insert into public.profiles (id, display_name, avatar_url)
select id, coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name'), raw_user_meta_data->>'avatar_url'
from auth.users on conflict (id) do nothing;

create or replace function public.apply_to_society(p_society_id uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user_id uuid := auth.uid(); v_membership_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.societies where id = p_society_id and status = 'approved') then
    raise exception 'Society is unavailable';
  end if;
  select id into v_membership_id from public.memberships
    where user_id = v_user_id and society_id = p_society_id and status = 'pending' limit 1;
  if v_membership_id is not null then return v_membership_id; end if;
  insert into public.memberships (user_id, society_id, status, role, competitive)
    values (v_user_id, p_society_id, 'pending', 'member', true) returning id into v_membership_id;
  return v_membership_id;
end;
$$;
revoke all on function public.apply_to_society(uuid) from public, anon;
grant execute on function public.apply_to_society(uuid) to authenticated;

create or replace function public.review_society_membership(p_membership_id uuid, p_decision text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user_id uuid := auth.uid(); v_society_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_decision is null or p_decision not in ('active','rejected') then raise exception 'Invalid membership decision'; end if;
  select society_id into v_society_id from public.memberships where id = p_membership_id and status = 'pending';
  if v_society_id is null then return false; end if;
  if not exists (
    select 1 from public.memberships m where m.user_id = v_user_id and m.society_id = v_society_id
      and m.status = 'active' and m.role in ('admin','moderator')
    union all select 1 from public.platform_admins a where a.user_id = v_user_id and a.revoked_at is null
  ) then raise exception 'Not authorized to manage this society'; end if;
  update public.memberships set status = p_decision, reviewed_by = v_user_id,
    effective_from = case when p_decision = 'active' then now() else effective_from end
    where id = p_membership_id and status = 'pending';
  return found;
end;
$$;
revoke all on function public.review_society_membership(uuid,text) from public, anon;
grant execute on function public.review_society_membership(uuid,text) to authenticated;

create or replace function public.list_society_membership_requests(p_slug text)
returns table (id uuid, applicant_name text, requested_at timestamptz)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_society_id uuid; v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select s.id into v_society_id from public.societies s where s.slug = p_slug and s.status = 'approved';
  if v_society_id is null then raise exception 'Society is unavailable'; end if;
  if not exists (
    select 1 from public.memberships m where m.user_id = v_user_id and m.society_id = v_society_id
      and m.status = 'active' and m.role in ('admin','moderator')
    union all select 1 from public.platform_admins a where a.user_id = v_user_id and a.revoked_at is null
  ) then raise exception 'Not authorized to manage this society'; end if;
  return query select m.id, coalesce(nullif(p.display_name, ''), p.username, 'AlgoGym member'), m.created_at
    from public.memberships m left join public.profiles p on p.id = m.user_id
    where m.society_id = v_society_id and m.status = 'pending' order by m.created_at;
end;
$$;
revoke all on function public.list_society_membership_requests(text) from public, anon;
grant execute on function public.list_society_membership_requests(text) to authenticated;

create or replace function public.get_public_profile(p_username text)
returns table (username text, display_name text, avatar_url text, created_at timestamptz, coding_profiles jsonb)
language sql stable security definer set search_path = public, pg_temp as $$
  select p.username, p.display_name, p.avatar_url, p.created_at,
    coalesce((select jsonb_agg(jsonb_build_object('platform', cp.platform, 'username', cp.username, 'verified_at', cp.verified_at) order by cp.platform)
      from public.coding_profiles cp where cp.user_id = p.id), '[]'::jsonb)
  from public.profiles p where p.username = p_username and p.is_public = true limit 1;
$$;
revoke all on function public.get_public_profile(text) from public;
grant execute on function public.get_public_profile(text) to anon, authenticated;

create or replace function public.get_public_leaderboard_labels(p_user_ids uuid[])
returns table (id uuid, label text) language sql stable security definer set search_path = public, pg_temp as $$
  select p.id, coalesce(nullif(p.display_name, ''), p.username, 'AlgoGym member')
  from public.profiles p where p.id = any(p_user_ids) and p.is_public = true;
$$;
revoke all on function public.get_public_leaderboard_labels(uuid[]) from public, anon;
grant execute on function public.get_public_leaderboard_labels(uuid[]) to authenticated;

create index if not exists provider_submissions_user_date on public.provider_submissions(user_id, submitted_at desc);
create index if not exists solves_user_accepted on public.solves(user_id, first_accepted_at desc) where proof_status = 'verified';
create index if not exists chakra_ledger_user_date on public.chakra_ledger(user_id, created_at desc);
create index if not exists leaderboard_entries_rank on public.leaderboard_entries(snapshot_id, rank);

alter table public.profiles enable row level security;
alter table public.platform_admins enable row level security;
alter table public.colleges enable row level security;
alter table public.college_aliases enable row level security;
alter table public.societies enable row level security;
alter table public.society_applications enable row level security;
alter table public.memberships enable row level security;
alter table public.problems enable row level security;
alter table public.training_lists enable row level security;
alter table public.training_items enable row level security;
alter table public.provider_sync_runs enable row level security;
alter table public.provider_submissions enable row level security;
alter table public.provider_rating_history enable row level security;
alter table public.provider_sync_cursors enable row level security;
alter table public.solves enable row level security;
alter table public.chakra_policies enable row level security;
alter table public.chakra_awards enable row level security;
alter table public.chakra_ledger enable row level security;
alter table public.outbox_events enable row level security;
alter table public.chakra_balance_cache enable row level security;
alter table public.analytics_daily enable row level security;
alter table public.society_analytics_daily enable row level security;
alter table public.leaderboard_snapshots enable row level security;
alter table public.leaderboard_entries enable row level security;
alter table public.audit_logs enable row level security;
alter table public.job_locks enable row level security;

create policy profile_owner_read on public.profiles for select to authenticated using (id = auth.uid());
create policy profile_owner_insert on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profile_owner_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy public_colleges_read on public.colleges for select to anon, authenticated using (status = 'approved');
create policy public_college_aliases_read on public.college_aliases for select to anon, authenticated using (exists (select 1 from public.colleges c where c.id = college_id and c.status = 'approved'));
create policy approved_societies_read on public.societies for select to anon, authenticated using (status = 'approved');
create policy membership_owner_read on public.memberships for select to authenticated using (user_id = auth.uid());
create policy active_problems_read on public.problems for select to authenticated using (active);
create policy public_training_lists_read on public.training_lists for select to authenticated using (visibility = 'public');
create policy public_training_items_read on public.training_items for select to authenticated using (exists (select 1 from public.training_lists l where l.id = training_list_id and l.visibility = 'public'));
create policy public_leaderboard_snapshots_read on public.leaderboard_snapshots for select to authenticated using (true);
create policy public_leaderboard_entries_read on public.leaderboard_entries for select to authenticated using (true);

revoke all on public.profiles, public.platform_admins, public.colleges, public.college_aliases,
  public.societies, public.society_applications, public.memberships, public.problems,
  public.training_lists, public.training_items, public.provider_sync_runs, public.provider_submissions,
  public.provider_rating_history, public.provider_sync_cursors, public.solves, public.chakra_policies,
  public.chakra_awards, public.chakra_ledger, public.outbox_events, public.chakra_balance_cache,
  public.analytics_daily, public.society_analytics_daily, public.leaderboard_snapshots,
  public.leaderboard_entries, public.audit_logs, public.job_locks from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, avatar_url, username, is_public, preferences) on public.profiles to authenticated;
grant select on public.colleges, public.college_aliases, public.societies to anon, authenticated;
grant select on public.memberships to authenticated;
grant select on public.problems, public.training_lists, public.training_items,
  public.leaderboard_snapshots, public.leaderboard_entries to authenticated;
grant all on public.profiles, public.platform_admins, public.colleges, public.college_aliases,
  public.societies, public.society_applications, public.memberships, public.problems,
  public.training_lists, public.training_items, public.provider_sync_runs, public.provider_submissions,
  public.provider_rating_history, public.provider_sync_cursors, public.solves, public.chakra_policies,
  public.chakra_awards, public.chakra_ledger, public.outbox_events, public.chakra_balance_cache,
  public.analytics_daily, public.society_analytics_daily, public.leaderboard_snapshots,
  public.leaderboard_entries, public.audit_logs, public.job_locks to service_role;
