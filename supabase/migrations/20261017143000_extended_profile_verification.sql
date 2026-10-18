-- Add ownership verification only; existing sync/reward providers remain CF and LC.
-- Preserves all records, uniqueness, privileges, RLS, and atomic challenge checks.
alter table public.coding_profiles drop constraint coding_profiles_platform_check;
alter table public.coding_profiles add constraint coding_profiles_platform_check check(platform in ('codeforces','leetcode','codechef','atcoder','github','geeksforgeeks'));
alter table public.profile_verification_challenges drop constraint profile_verification_challenges_platform_check;
alter table public.profile_verification_challenges add constraint profile_verification_challenges_platform_check check(platform in ('codeforces','leetcode','codechef','atcoder','github','geeksforgeeks'));
alter table public.profile_verification_events drop constraint profile_verification_events_platform_check;
alter table public.profile_verification_events add constraint profile_verification_events_platform_check check(platform in ('codeforces','leetcode','codechef','atcoder','github','geeksforgeeks'));
create or replace function public.create_owned_challenge(p_user uuid,p_platform text,p_username text,p_token_hash text)
returns timestamptz language plpgsql security definer set search_path=public,pg_temp as $$
declare v_expires timestamptz:=now()+interval '10 minutes';
begin
 if p_platform not in ('codeforces','leetcode','codechef','atcoder','github','geeksforgeeks') or p_username !~ '^[A-Za-z0-9_.-]{1,50}$' or p_token_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid challenge'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text||p_platform,0));
 if exists(select 1 from public.coding_profiles where user_id=p_user and platform=p_platform) then raise exception 'A verified account is already connected'; end if;
 if exists(select 1 from public.coding_profiles where platform=p_platform and username_normalized=lower(p_username)) then raise exception 'This account is already connected to another user'; end if;
 if (select count(*) from public.profile_verification_events where user_id=p_user and platform=p_platform and event='generate' and created_at>now()-interval '1 hour')>=5 then raise exception 'Too many codes requested; retry in an hour'; end if;
 insert into public.profile_verification_challenges(user_id,platform,username,token_hash,created_at,expires_at,attempt_count) values(p_user,p_platform,p_username,p_token_hash,now(),v_expires,0)
 on conflict(user_id,platform) do update set username=excluded.username,token_hash=excluded.token_hash,created_at=excluded.created_at,expires_at=excluded.expires_at,attempt_count=0;
 insert into public.profile_verification_events(user_id,platform,event) values(p_user,p_platform,'generate');
 return v_expires;
end; $$;

create or replace function public.enqueue_due_profile_syncs(p_limit integer default 100) returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare v_count integer;
begin
 if p_limit not between 1 and 1000 then raise exception 'Invalid batch size';end if;
 insert into public.sync_jobs(user_id,provider)
 select cp.user_id,cp.platform from public.coding_profiles cp left join public.provider_snapshots s on s.user_id=cp.user_id and s.provider=cp.platform
 where cp.platform in ('codeforces','leetcode') and (s.last_synced_at is null or s.last_synced_at<now()-interval '12 hours')
 and not exists(select 1 from public.sync_jobs j where j.user_id=cp.user_id and j.provider=cp.platform and (j.status in ('queued','running','retrying') or j.created_at>now()-interval '15 minutes'))
 order by s.last_synced_at nulls first,cp.user_id,cp.platform limit p_limit on conflict do nothing;
 get diagnostics v_count=row_count;return v_count;
end; $$;
revoke all on function public.enqueue_due_profile_syncs(integer) from public,anon,authenticated;
grant execute on function public.enqueue_due_profile_syncs(integer) to service_role;

