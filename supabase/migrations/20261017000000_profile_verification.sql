create table if not exists public.coding_profiles (
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('codeforces', 'leetcode')),
  username text not null,
  username_normalized text generated always as (lower(username)) stored,
  verified_at timestamptz not null default now(),
  primary key (user_id, platform),
  unique (platform, username_normalized)
);

create table if not exists public.profile_verification_challenges (
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('codeforces', 'leetcode')),
  username text not null,
  token_hash text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  attempt_count integer not null default 0 check (attempt_count between 0 and 5),
  primary key (user_id, platform)
);

create table if not exists public.profile_verification_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('codeforces', 'leetcode')),
  event text not null check (event in ('generate', 'verify')),
  created_at timestamptz not null default now()
);

create table if not exists public.app_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  onboarding_completed_at timestamptz
);

alter table public.coding_profiles enable row level security;
alter table public.profile_verification_challenges enable row level security;
alter table public.profile_verification_events enable row level security;
alter table public.app_profiles enable row level security;

revoke all on public.coding_profiles, public.profile_verification_challenges,
  public.profile_verification_events, public.app_profiles from anon, authenticated;
grant all on public.coding_profiles, public.profile_verification_challenges,
  public.profile_verification_events, public.app_profiles to service_role;
grant usage, select on sequence public.profile_verification_events_id_seq to service_role;
