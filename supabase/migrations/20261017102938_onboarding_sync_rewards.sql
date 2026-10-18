-- Additive upgrade of the existing verification schema. No identity or verification records are replaced.
create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;
alter table public.profiles add column college_id uuid references public.colleges(id) on delete set null;
alter table public.profiles add column academic_year text check (academic_year in ('First Year','Second Year','Third Year','Fourth Year','Fifth Year','Graduated'));
alter table public.profiles add column onboarding_step integer not null default 0 check (onboarding_step between 0 and 6);
alter table public.profiles add column onboarding_completed_at timestamptz;
alter table public.profiles add column chakra_activated_at timestamptz not null default now();
update public.profiles p set onboarding_completed_at=a.onboarding_completed_at, onboarding_step=6 from public.app_profiles a where a.user_id=p.id and a.onboarding_completed_at is not null;
create unique index profiles_username_casefold on public.profiles(lower(username)) where username is not null;
create policy coding_profiles_owner_read on public.coding_profiles for select to authenticated using (user_id=(select auth.uid()));
grant select on public.coding_profiles to authenticated;
alter table public.colleges add column source text;
alter table public.colleges add column source_ref text;
alter table public.colleges add column source_updated_at timestamptz;
alter table public.colleges add column acronym text;
create unique index colleges_source_identity on public.colleges(source,source_ref) where source is not null and source_ref is not null;
create index colleges_search on public.colleges using gin(normalized_name extensions.gin_trgm_ops);
create index colleges_acronym on public.colleges(acronym);
create table public.college_requests (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null, normalized_name text not null, city text not null, state text not null, website text,
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 college_id uuid references public.colleges(id), created_at timestamptz not null default now(),
 decided_at timestamptz, decided_by uuid references auth.users(id), reason text,
 unique(user_id,normalized_name)
);
alter table public.college_requests enable row level security;
create policy own_college_requests on public.college_requests for select to authenticated using(user_id=(select auth.uid()));
revoke all on public.college_requests from anon,authenticated;
grant select on public.college_requests to authenticated;
grant all on public.college_requests to service_role;

create function public.search_colleges(p_query text)
returns table(id uuid,name text,city text,state text) language sql stable security invoker set search_path=public,pg_temp as $$
 select c.id,c.name,c.city,c.state from public.colleges c
 where c.status='approved' and length(trim(p_query)) between 2 and 100 and (
   not exists(select 1 from unnest(string_to_array(trim(regexp_replace(lower(p_query),'[^a-z0-9]+',' ','g')),' ')) term where c.normalized_name not like '%'||term||'%')
   or c.acronym=regexp_replace(lower(p_query),'[^a-z0-9]','','g')
   or exists(select 1 from public.college_aliases a where a.college_id=c.id and a.normalized_alias=regexp_replace(lower(p_query),'[^a-z0-9]','','g'))
 ) order by (c.acronym=regexp_replace(lower(p_query),'[^a-z0-9]','','g')) desc nulls last,c.name limit 20;
$$;
revoke all on function public.search_colleges(text) from public;
grant execute on function public.search_colleges(text) to anon,authenticated;

create function public.request_college(p_name text,p_city text,p_state text,p_website text default null)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_user uuid:=auth.uid(); v_id uuid; v_normal text;
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 if length(trim(p_name)) not between 3 and 200 or length(trim(p_city)) not between 2 and 120 or length(trim(p_state)) not between 2 and 100 then raise exception 'Complete institution name, city, and state'; end if;
 if p_website is not null and (length(p_website)>2083 or p_website !~ '^https?://') then raise exception 'Invalid website'; end if;
 if (select count(*) from public.college_requests where user_id=v_user and created_at>now()-interval '1 day')>=5 then raise exception 'Too many institution requests'; end if;
 v_normal:=trim(regexp_replace(lower(p_name||' '||p_city||' '||p_state),'[^a-z0-9]+',' ','g'));
 insert into public.college_requests(user_id,name,normalized_name,city,state,website) values(v_user,trim(p_name),v_normal,trim(p_city),trim(p_state),p_website)
 on conflict(user_id,normalized_name) do update set name=excluded.name returning id into v_id;
 return v_id;
end; $$;
revoke all on function public.request_college(text,text,text,text) from public,anon;
grant execute on function public.request_college(text,text,text,text) to authenticated;

create function public.save_onboarding(p_display_name text,p_academic_year text,p_college_id uuid,p_step integer)
returns public.profiles language plpgsql security definer set search_path=public,pg_temp as $$
declare v_user uuid:=auth.uid(); v_profile public.profiles;
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 if p_step not between 1 and 6 or length(trim(p_display_name)) not between 2 and 80 then raise exception 'Enter your full name'; end if;
 if p_academic_year is null or p_academic_year not in ('First Year','Second Year','Third Year','Fourth Year','Fifth Year','Graduated') then raise exception 'Select your academic year'; end if;
 if p_college_id is not null and not exists(select 1 from public.colleges where id=p_college_id and status='approved') then raise exception 'Select an approved institution'; end if;
 if p_step=6 and p_college_id is null and not exists(select 1 from public.college_requests where user_id=v_user and status='pending') then raise exception 'Select your college or submit a missing-college request'; end if;
 update public.profiles set display_name=trim(p_display_name),academic_year=p_academic_year,college_id=p_college_id,
 onboarding_step=greatest(onboarding_step,p_step),onboarding_completed_at=case when p_step=6 then coalesce(onboarding_completed_at,now()) else onboarding_completed_at end,updated_at=now()
 where id=v_user returning * into v_profile;
 if not found then raise exception 'Your profile could not be found'; end if;
 return v_profile;
end; $$;
revoke all on function public.save_onboarding(text,text,uuid,integer) from public,anon;
grant execute on function public.save_onboarding(text,text,uuid,integer) to authenticated;

create table public.provider_snapshots (
 user_id uuid not null references auth.users(id) on delete cascade, provider text not null check(provider in ('codeforces','leetcode')),
 profile jsonb not null default '{}', summary jsonb not null default '{}', history_complete boolean not null default false,
 last_synced_at timestamptz, updated_at timestamptz not null default now(), primary key(user_id,provider)
);
create table public.sync_jobs (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 provider text not null check(provider in ('codeforces','leetcode')), status text not null default 'queued' check(status in ('queued','running','retrying','succeeded','failed')),
 cursor jsonb not null default '{}', attempts integer not null default 0, run_after timestamptz not null default now(),
 leased_until timestamptz, lease_token uuid, error_code text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index one_pending_sync on public.sync_jobs(user_id,provider) where status in ('queued','running','retrying');
create index runnable_sync_jobs on public.sync_jobs(run_after,created_at) where status in ('queued','running','retrying');
alter table public.provider_snapshots enable row level security;
alter table public.sync_jobs enable row level security;
create policy own_provider_snapshots on public.provider_snapshots for select to authenticated using(user_id=(select auth.uid()));
create policy own_sync_jobs on public.sync_jobs for select to authenticated using(user_id=(select auth.uid()));
create policy own_solves on public.solves for select to authenticated using(user_id=(select auth.uid()));
create policy own_ledger on public.chakra_ledger for select to authenticated using(user_id=(select auth.uid()));
create policy own_awards on public.chakra_awards for select to authenticated using(user_id=(select auth.uid()));
create policy own_ratings on public.provider_rating_history for select to authenticated using(user_id=(select auth.uid()));
grant select on public.provider_snapshots,public.sync_jobs,public.solves,public.chakra_ledger,public.chakra_awards,public.provider_rating_history to authenticated;
revoke all on public.provider_snapshots,public.sync_jobs from anon;
grant all on public.provider_snapshots,public.sync_jobs to service_role;

create function public.request_provider_sync(p_provider text)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_user uuid:=auth.uid(); v_job uuid;
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 if p_provider is null or p_provider not in ('codeforces','leetcode') or not exists(select 1 from public.coding_profiles where user_id=v_user and platform=p_provider) then raise exception 'Verify this coding account before requesting synchronization'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text||p_provider,0));
 select id into v_job from public.sync_jobs where user_id=v_user and provider=p_provider and status in ('queued','running','retrying') limit 1;
 if v_job is not null then return v_job; end if;
 if (select count(*) from public.sync_jobs where user_id=v_user and provider=p_provider and created_at>now()-interval '15 minutes')>=5 then raise exception 'Sync limit reached. Retry after 15 minutes'; end if;
 insert into public.sync_jobs(user_id,provider) values(v_user,p_provider) returning id into v_job;
 return v_job;
end; $$;
revoke all on function public.request_provider_sync(text) from public,anon;
grant execute on function public.request_provider_sync(text) to authenticated;

create function public.lease_sync_job()
returns setof public.sync_jobs language plpgsql security definer set search_path=public,pg_temp as $$
declare v_job uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended('algogym-provider-worker',0));
 if exists(select 1 from public.sync_jobs where status='running' and leased_until>now()) then return; end if;
 select id into v_job from public.sync_jobs where ((status in ('queued','retrying') and run_after<=now()) or (status='running' and leased_until<=now())) and attempts<8 order by run_after,created_at for update skip locked limit 1;
 if v_job is null then return; end if;
 return query update public.sync_jobs set status='running',lease_token=gen_random_uuid(),leased_until=now()+interval '90 seconds',attempts=attempts+1,updated_at=now() where id=v_job returning *;
end; $$;
revoke all on function public.lease_sync_job() from public,anon,authenticated;
grant execute on function public.lease_sync_job() to service_role;

insert into public.chakra_policies(version,effective_at,cf_brackets,lc_difficulty_points,status)
values('v1-2026-10',now(),'[[800,999,10],[1000,1199,15],[1200,1399,25],[1400,1599,40],[1600,1799,60],[1800,1999,85],[2000,2199,115],[2200,2399,150],[2400,2599,190],[2600,2799,240],[2800,2999,300],[3000,3199,375],[3200,3399,475],[3400,3500,600]]','{"Easy":15,"Medium":45,"Hard":110}','active');

create function public.ingest_cf_page(p_job_id uuid,p_lease_token uuid,p_submissions jsonb)
returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare v_job public.sync_jobs; v_handle text; s jsonb; v_problem uuid; v_when timestamptz; v_count integer:=0;
begin
 select * into v_job from public.sync_jobs where id=p_job_id and lease_token=p_lease_token and status='running' and leased_until>now() for update;
 if not found or v_job.provider<>'codeforces' then raise exception 'Sync lease is not active'; end if;
 select username into v_handle from public.coding_profiles where user_id=v_job.user_id and platform='codeforces';
 if v_handle is null then raise exception 'Verified coding account is unavailable'; end if;
 for s in select value from jsonb_array_elements(p_submissions) loop
  if s->>'verdict' is distinct from 'OK' or jsonb_array_length(coalesce(s#>'{author,members}','[]'))<>1 or lower(s#>>'{author,members,0,handle}') is distinct from lower(v_handle) then continue; end if;
  if coalesce(s#>>'{problem,index}','') !~ '^[A-Za-z0-9]+$' or coalesce(s#>>'{problem,contestId}','') !~ '^[0-9]+$' or coalesce(s->>'id','') !~ '^[0-9]+$' then continue; end if;
  v_when:=to_timestamp((s->>'creationTimeSeconds')::double precision);
  if v_when>now()+interval '5 minutes' then continue; end if;
  insert into public.problems(provider,external_problem_id,title,url,cf_rating,tags,last_synced_at)
  values('codeforces',(s#>>'{problem,contestId}')||':'||(s#>>'{problem,index}'),s#>>'{problem,name}','https://codeforces.com/problemset/problem/'||(s#>>'{problem,contestId}')||'/'||(s#>>'{problem,index}'),(s#>>'{problem,rating}')::integer,array(select jsonb_array_elements_text(coalesce(s#>'{problem,tags}','[]'))),now())
  on conflict(provider,external_problem_id) do update set title=excluded.title,cf_rating=coalesce(excluded.cf_rating,problems.cf_rating),tags=excluded.tags,last_synced_at=now() returning id into v_problem;
  insert into public.provider_submissions(provider,provider_submission_id,user_id,problem_id,verdict,submitted_at) values('codeforces',s->>'id',v_job.user_id,v_problem,'OK',v_when) on conflict(provider,provider_submission_id) do nothing;
  insert into public.solves(user_id,problem_id,first_accepted_at,proof_submission_id,proof_status) values(v_job.user_id,v_problem,v_when,s->>'id','verified')
  on conflict(user_id,problem_id) do update set first_accepted_at=least(solves.first_accepted_at,excluded.first_accepted_at),proof_submission_id=case when excluded.first_accepted_at<solves.first_accepted_at then excluded.proof_submission_id else solves.proof_submission_id end;
  v_count:=v_count+1;
 end loop;
 return v_count;
end; $$;
revoke all on function public.ingest_cf_page(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.ingest_cf_page(uuid,uuid,jsonb) to service_role;

create function public.award_pending_cf_solves(p_user_id uuid)
returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare s record; policy public.chakra_policies; bracket jsonb; v_points integer; v_award uuid; v_count integer:=0;
begin
 if not exists(select 1 from public.provider_snapshots where user_id=p_user_id and provider='codeforces' and history_complete) then return 0; end if;
 for s in select so.*,p.cf_rating from public.solves so join public.problems p on p.id=so.problem_id join public.profiles pr on pr.id=so.user_id join public.coding_profiles cp on cp.user_id=so.user_id and cp.platform='codeforces'
 where so.user_id=p_user_id and p.provider='codeforces' and so.proof_status='verified' and so.first_accepted_at>=greatest(pr.chakra_activated_at,cp.verified_at) and not exists(select 1 from public.chakra_awards a where a.user_id=so.user_id and a.problem_id=so.problem_id) loop
  select * into policy from public.chakra_policies where status in ('active','retired') and effective_at<=s.first_accepted_at order by effective_at desc limit 1;
  if not found then continue; end if;
  v_points:=null;
  for bracket in select value from jsonb_array_elements(policy.cf_brackets) loop
   if s.cf_rating between (bracket->>0)::integer and (bracket->>1)::integer then v_points:=(bracket->>2)::integer; exit; end if;
  end loop;
  if v_points is null or v_points<=0 then continue; end if;
  v_award:=null;
  insert into public.chakra_awards(user_id,problem_id,solve_id,policy_id,difficulty_snapshot,points) values(p_user_id,s.problem_id,s.id,policy.id,jsonb_build_object('provider','codeforces','rating',s.cf_rating),v_points) on conflict do nothing returning id into v_award;
  if v_award is not null then
   insert into public.chakra_ledger(user_id,award_id,entry_type,delta,reason) values(p_user_id,v_award,'grant',v_points,'First eligible verified accepted solve');
   insert into public.outbox_events(event_type,aggregate_id,payload) values('chakra.awarded',v_award,jsonb_build_object('user_id',p_user_id,'points',v_points,'problem_id',s.problem_id));
   insert into public.chakra_balance_cache(user_id,balance) values(p_user_id,v_points) on conflict(user_id) do update set balance=chakra_balance_cache.balance+excluded.balance,refreshed_at=now();
   v_count:=v_count+1;
  end if;
 end loop;
 return v_count;
end; $$;
revoke all on function public.award_pending_cf_solves(uuid) from public,anon,authenticated;
grant execute on function public.award_pending_cf_solves(uuid) to service_role;

create function public.prevent_immutable_change() returns trigger language plpgsql set search_path=public,pg_temp as $$ begin raise exception 'This record is immutable; use an authorized compensating event'; end; $$;
create trigger immutable_chakra_ledger before update or delete on public.chakra_ledger for each row execute function public.prevent_immutable_change();
create trigger immutable_chakra_awards before update or delete on public.chakra_awards for each row execute function public.prevent_immutable_change();
create trigger immutable_chakra_policies before update or delete on public.chakra_policies for each row when(old.status<>'draft') execute function public.prevent_immutable_change();

create function public.create_owned_challenge(p_user uuid,p_platform text,p_username text,p_token_hash text)
returns timestamptz language plpgsql security definer set search_path=public,pg_temp as $$
declare v_expires timestamptz:=now()+interval '10 minutes';
begin
 if p_platform not in ('codeforces','leetcode') or p_username !~ '^[A-Za-z0-9_.-]{1,50}$' or p_token_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid challenge'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text||p_platform,0));
 if exists(select 1 from public.coding_profiles where user_id=p_user and platform=p_platform) then raise exception 'A verified account is already connected'; end if;
 if exists(select 1 from public.coding_profiles where platform=p_platform and username_normalized=lower(p_username)) then raise exception 'This account is already connected to another user'; end if;
 if (select count(*) from public.profile_verification_events where user_id=p_user and platform=p_platform and event='generate' and created_at>now()-interval '1 hour')>=5 then raise exception 'Too many codes requested; retry in an hour'; end if;
 insert into public.profile_verification_challenges(user_id,platform,username,token_hash,created_at,expires_at,attempt_count) values(p_user,p_platform,p_username,p_token_hash,now(),v_expires,0)
 on conflict(user_id,platform) do update set username=excluded.username,token_hash=excluded.token_hash,created_at=excluded.created_at,expires_at=excluded.expires_at,attempt_count=0;
 insert into public.profile_verification_events(user_id,platform,event) values(p_user,p_platform,'generate');
 return v_expires;
end; $$;
create function public.consume_challenge_attempt(p_user uuid,p_platform text,p_username text,p_token_hash text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.profile_verification_challenges;
begin
 select * into c from public.profile_verification_challenges where user_id=p_user and platform=p_platform for update;
 if not found then return '{"ok":false,"code":"missing"}'::jsonb; end if;
 if c.expires_at<=now() then return '{"ok":false,"code":"expired"}'::jsonb; end if;
 if c.attempt_count>=5 or (select count(*) from public.profile_verification_events where user_id=p_user and platform=p_platform and event='verify' and created_at>now()-interval '1 hour')>=20 then return '{"ok":false,"code":"rate_limited"}'::jsonb; end if;
 update public.profile_verification_challenges set attempt_count=attempt_count+1 where user_id=p_user and platform=p_platform;
 insert into public.profile_verification_events(user_id,platform,event) values(p_user,p_platform,'verify');
 if c.token_hash<>p_token_hash or lower(c.username)<>lower(p_username) then return '{"ok":false,"code":"mismatch"}'::jsonb; end if;
 return '{"ok":true}'::jsonb;
end; $$;
create function public.claim_verified_profile(p_user uuid,p_platform text,p_username text,p_token_hash text)
returns timestamptz language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.profile_verification_challenges; v_verified timestamptz:=now();
begin
 select * into c from public.profile_verification_challenges where user_id=p_user and platform=p_platform for update;
 if not found or c.expires_at<=now() or c.attempt_count>5 or c.token_hash<>p_token_hash or lower(c.username)<>lower(p_username) then raise exception 'The challenge expired, changed, or was already used'; end if;
 insert into public.coding_profiles(user_id,platform,username,verified_at) values(p_user,p_platform,p_username,v_verified);
 delete from public.profile_verification_challenges where user_id=p_user and platform=p_platform;
 return v_verified;
end; $$;
revoke all on function public.create_owned_challenge(uuid,text,text,text),public.consume_challenge_attempt(uuid,text,text,text),public.claim_verified_profile(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.create_owned_challenge(uuid,text,text,text),public.consume_challenge_attempt(uuid,text,text,text),public.claim_verified_profile(uuid,text,text,text) to service_role;
