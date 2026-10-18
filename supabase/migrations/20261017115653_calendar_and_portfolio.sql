alter table public.profiles add column bio text not null default '' check(length(bio)<=1000);
alter table public.profiles add column country_code text check(country_code is null or country_code ~ '^[A-Z]{2}$');
alter table public.profiles add column website_url text check(website_url is null or length(website_url)<=300 and website_url ~ '^https://[^[:space:]<>]+$');
alter table public.profiles add column github_url text check(github_url is null or length(github_url)<=300 and github_url ~ '^https://github\.com/[A-Za-z0-9-]+/?$');
alter table public.profiles add column linkedin_url text check(linkedin_url is null or length(linkedin_url)<=300 and linkedin_url ~ '^https://(www\.)?linkedin\.com/in/[^[:space:]<>]+$');
alter table public.profiles add column x_url text check(x_url is null or length(x_url)<=300 and x_url ~ '^https://(x\.com|twitter\.com)/[A-Za-z0-9_]+/?$');
grant update(bio,country_code,website_url,github_url,linkedin_url,x_url,updated_at) on public.profiles to authenticated;

create table public.contest_events(
 id uuid primary key default gen_random_uuid(),
 provider text not null check(provider in ('codeforces','leetcode','codechef','atcoder')),
 external_id text not null,
 title text not null,
 url text not null check(url ~ '^https://'),
 starts_at timestamptz not null,ends_at timestamptz not null,
 fetched_at timestamptz not null default now(),
 unique(provider,external_id),check(ends_at>starts_at)
);
create index contest_events_start on public.contest_events(starts_at);
create table public.contest_subscriptions(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 event_id uuid not null references public.contest_events(id) on delete cascade,
 created_at timestamptz not null default now(),unique(user_id,event_id)
);
alter table public.contest_events enable row level security;
alter table public.contest_subscriptions enable row level security;
revoke all on public.contest_events,public.contest_subscriptions from public,anon,authenticated;
grant select on public.contest_events to anon,authenticated;
grant select,delete on public.contest_subscriptions to authenticated;
grant all on public.contest_events,public.contest_subscriptions to service_role;
create policy public_contest_events on public.contest_events for select to anon,authenticated using(true);
create policy own_contest_subscriptions on public.contest_subscriptions for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create function public.subscribe_to_contest(p_event uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 if not exists(select 1 from public.contest_events where id=p_event and ends_at>now()) then raise exception 'This contest has ended or is unavailable';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||'contest-subscribe',0));
 if (select count(*) from public.contest_subscriptions where user_id=auth.uid() and created_at>now()-interval '1 day')>=60 then raise exception 'Subscription limit reached; retry tomorrow';end if;
 insert into public.contest_subscriptions(user_id,event_id) values(auth.uid(),p_event) on conflict(user_id,event_id) do nothing;
end; $$;
create function public.contest_subscription_counts(p_events uuid[]) returns table(event_id uuid,subscribers bigint) language sql stable security definer set search_path=public,pg_temp as $$
 select e.id,count(s.id) from public.contest_events e left join public.contest_subscriptions s on s.event_id=e.id where e.id=any(p_events) and array_length(p_events,1)<=2000 group by e.id;
$$;
revoke all on function public.subscribe_to_contest(uuid),public.contest_subscription_counts(uuid[]) from public,anon;
grant execute on function public.subscribe_to_contest(uuid),public.contest_subscription_counts(uuid[]) to authenticated;

create function public.get_public_portfolio(p_username text) returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare p public.profiles; v_complete boolean;
begin
 select * into p from public.profiles where lower(username)=lower(p_username) and is_public;
 if not found then return null;end if;
 select coalesce(bool_or(history_complete),false) into v_complete from public.provider_snapshots where user_id=p.id and provider='codeforces';
 return jsonb_build_object(
 'profile',jsonb_build_object('username',p.username,'display_name',p.display_name,'avatar_url',p.avatar_url,'bio',p.bio,'country_code',p.country_code,'academic_year',p.academic_year,'website_url',p.website_url,'github_url',p.github_url,'linkedin_url',p.linkedin_url,'x_url',p.x_url,'created_at',p.created_at,'colleges',(select jsonb_build_object('id',c.id,'name',c.name,'city',c.city,'state',c.state) from public.colleges c where c.id=p.college_id and c.status='approved')),
 'accounts',coalesce((select jsonb_agg(jsonb_build_object('platform',cp.platform,'username',cp.username,'verified_at',cp.verified_at)) from public.coding_profiles cp where cp.user_id=p.id),'[]'::jsonb),
 'snapshots',coalesce((select jsonb_agg(jsonb_build_object('provider',s.provider,'summary',s.summary,'last_synced_at',s.last_synced_at,'history_complete',s.history_complete)) from public.provider_snapshots s join public.coding_profiles cp on cp.user_id=s.user_id and cp.platform=s.provider where s.user_id=p.id),'[]'::jsonb),
 'historyComplete',v_complete,
 'overview',jsonb_build_object('chakra',coalesce((select sum(delta) from public.chakra_ledger where user_id=p.id),0),'verifiedSolves',case when v_complete then (select count(*) from public.solves where user_id=p.id and proof_status='verified') else null end,'activeDays',case when v_complete then (select count(distinct (first_accepted_at at time zone 'UTC')::date) from public.solves where user_id=p.id and proof_status='verified') else null end),
 'activity',coalesce((select jsonb_agg(jsonb_build_object('date',activity_day,'count',n) order by activity_day) from (select (first_accepted_at at time zone 'UTC')::date as activity_day,count(*) n from public.solves where user_id=p.id and proof_status='verified' group by 1) a),'[]'::jsonb),
 'ratingHistory',coalesce((select jsonb_agg(jsonb_build_object('provider',provider,'date',contest_at,'contestId',contest_id,'before',rating_before,'rating',rating_after) order by contest_at) from public.provider_rating_history where user_id=p.id),'[]'::jsonb),
 'topics',coalesce((select jsonb_agg(jsonb_build_object('topic',tag,'count',n) order by n desc,tag) from (select tag,count(*) n from public.solves so join public.problems pr on pr.id=so.problem_id cross join lateral unnest(pr.tags) tag where so.user_id=p.id and so.proof_status='verified' group by tag) t),'[]'::jsonb)
 );
end; $$;
revoke all on function public.get_public_portfolio(text) from public;
grant execute on function public.get_public_portfolio(text) to anon,authenticated;

create function public.get_my_portfolio_summary() returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select jsonb_build_object('solves',case when exists(select 1 from public.provider_snapshots where user_id=auth.uid() and provider='codeforces' and history_complete) then (select count(*) from public.solves where user_id=auth.uid() and proof_status='verified') else null end,
 'activeDays',case when exists(select 1 from public.provider_snapshots where user_id=auth.uid() and provider='codeforces' and history_complete) then (select count(distinct(first_accepted_at at time zone 'UTC')::date) from public.solves where user_id=auth.uid() and proof_status='verified') else null end,
 'chakra',coalesce((select sum(delta) from public.chakra_ledger where user_id=auth.uid()),0));
$$;
revoke all on function public.get_my_portfolio_summary() from public,anon;
grant execute on function public.get_my_portfolio_summary() to authenticated;
