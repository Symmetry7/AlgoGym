-- M11: per-user judge rate limits in Postgres (no Redis; DECISIONS.md 2026-11-27). Additive: a new table and function.
-- Limits: 30 runs per 5 minutes, 10 submits per minute (SYSTEM_ARCHITECTURE.md §7).

create table public.judge_rate_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('run', 'submit')),
  created_at timestamptz not null default now()
);
create index judge_rate_events_user_mode_idx on public.judge_rate_events (user_id, mode, created_at desc);

alter table public.judge_rate_events enable row level security;
revoke all on table public.judge_rate_events from anon, authenticated;
grant all on table public.judge_rate_events to service_role;

-- Takes one slot atomically (a per-user, per-mode advisory lock serialises concurrent requests).
-- Returns 0 when the slot is granted, otherwise the seconds until the oldest event in the window expires.
create function public.judge_take_slot(p_user uuid, p_mode text) returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  lim integer;
  win interval;
  used integer;
  oldest timestamptz;
begin
  if p_mode = 'run' then lim := 30; win := interval '5 minutes';
  elsif p_mode = 'submit' then lim := 10; win := interval '1 minute';
  else raise exception 'unknown mode %', p_mode;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user::text || ':' || p_mode, 0));
  select count(*), min(created_at) into used, oldest
    from public.judge_rate_events
    where user_id = p_user and mode = p_mode and created_at > now() - win;
  if used >= lim then
    return greatest(1, ceil(extract(epoch from (oldest + win - now())))::integer);
  end if;
  insert into public.judge_rate_events (user_id, mode) values (p_user, p_mode);
  -- Keep the table small: a day of history is plenty for any window.
  delete from public.judge_rate_events where user_id = p_user and created_at < now() - interval '1 day';
  return 0;
end;
$$;
revoke all on function public.judge_take_slot(uuid, text) from public, anon, authenticated;
grant execute on function public.judge_take_slot(uuid, text) to service_role;
