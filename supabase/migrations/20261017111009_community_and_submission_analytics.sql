-- Add public Codeforces evidence without changing existing solves, awards or identities.
alter table public.provider_submissions add column language text;
alter table public.provider_submissions add column runtime_ms integer;
alter table public.provider_submissions add column memory_bytes bigint;
alter table public.provider_submissions add column contest_id integer;
alter table public.provider_submissions add column relative_time_seconds bigint;
alter table public.provider_submissions add column participant_type text;
alter table public.provider_rating_history add column contest_name text;
alter table public.provider_rating_history add column contest_rank integer;
alter table public.provider_snapshots add column submissions_complete boolean not null default false;
create policy own_submission_evidence on public.provider_submissions for select to authenticated using(user_id=(select auth.uid()));
grant select on public.provider_submissions to authenticated;

create or replace function public.search_colleges(p_query text)
returns table(id uuid,name text,city text,state text) language sql stable security invoker set search_path=public,pg_temp as $$
 select c.id,c.name,c.city,c.state from public.colleges c
 where c.status='approved' and length(trim(p_query)) between 2 and 100 and (
  not exists(select 1 from unnest(string_to_array(trim(regexp_replace(lower(p_query),'[^a-z0-9]+',' ','g')),' ')) term where c.normalized_name not like '%'||term||'%' and coalesce(c.acronym,'') not like term||'%')
  or exists(select 1 from public.college_aliases a where a.college_id=c.id and a.normalized_alias=regexp_replace(lower(p_query),'[^a-z0-9]','','g'))
 ) order by (c.acronym=regexp_replace(lower(p_query),'[^a-z0-9]','','g')) desc nulls last,c.name limit 20;
$$;

create or replace function public.ingest_cf_page(p_job_id uuid,p_lease_token uuid,p_submissions jsonb)
returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare v_job public.sync_jobs; v_handle text; s jsonb; v_problem uuid; v_when timestamptz; v_count integer:=0;
begin
 select * into v_job from public.sync_jobs where id=p_job_id and lease_token=p_lease_token and status='running' and leased_until>now() for update;
 if not found or v_job.provider<>'codeforces' then raise exception 'Sync lease is not active'; end if;
 select username into v_handle from public.coding_profiles where user_id=v_job.user_id and platform='codeforces';
 if v_handle is null then raise exception 'Verified coding account is unavailable'; end if;
 if jsonb_typeof(p_submissions)<>'array' or jsonb_array_length(p_submissions)>1000 then raise exception 'Invalid submission page'; end if;
 for s in select value from jsonb_array_elements(p_submissions) loop
  if jsonb_array_length(coalesce(s#>'{author,members}','[]'))<>1 or lower(s#>>'{author,members,0,handle}') is distinct from lower(v_handle) then continue; end if;
  if coalesce(s#>>'{problem,index}','') !~ '^[A-Za-z0-9]+$' or coalesce(s#>>'{problem,contestId}','') !~ '^[0-9]+$' or coalesce(s->>'id','') !~ '^[0-9]+$' then continue; end if;
  v_when:=to_timestamp((s->>'creationTimeSeconds')::double precision);
  if v_when>now()+interval '5 minutes' then continue; end if;
  insert into public.problems(provider,external_problem_id,title,url,cf_rating,tags,last_synced_at)
  values('codeforces',(s#>>'{problem,contestId}')||':'||(s#>>'{problem,index}'),s#>>'{problem,name}','https://codeforces.com/problemset/problem/'||(s#>>'{problem,contestId}')||'/'||(s#>>'{problem,index}'),(s#>>'{problem,rating}')::integer,array(select jsonb_array_elements_text(coalesce(s#>'{problem,tags}','[]'))),now())
  on conflict(provider,external_problem_id) do update set title=excluded.title,cf_rating=coalesce(excluded.cf_rating,problems.cf_rating),tags=excluded.tags,last_synced_at=now() returning id into v_problem;
  insert into public.provider_submissions(provider,provider_submission_id,user_id,problem_id,verdict,submitted_at,language,runtime_ms,memory_bytes,contest_id,relative_time_seconds,participant_type)
  values('codeforces',s->>'id',v_job.user_id,v_problem,coalesce(s->>'verdict','TESTING'),v_when,s->>'programmingLanguage',(s->>'timeConsumedMillis')::integer,(s->>'memoryConsumedBytes')::bigint,(s->>'contestId')::integer,(s->>'relativeTimeSeconds')::bigint,s#>>'{author,participantType}')
  on conflict(provider,provider_submission_id) do update set verdict=excluded.verdict,language=excluded.language,runtime_ms=excluded.runtime_ms,memory_bytes=excluded.memory_bytes,contest_id=excluded.contest_id,relative_time_seconds=excluded.relative_time_seconds,participant_type=excluded.participant_type,fetched_at=now()
  where provider_submissions.user_id=excluded.user_id;
  if s->>'verdict'='OK' then
   insert into public.solves(user_id,problem_id,first_accepted_at,proof_submission_id,proof_status) values(v_job.user_id,v_problem,v_when,s->>'id','verified')
   on conflict(user_id,problem_id) do update set first_accepted_at=least(solves.first_accepted_at,excluded.first_accepted_at),proof_submission_id=case when excluded.first_accepted_at<solves.first_accepted_at then excluded.proof_submission_id else solves.proof_submission_id end;
  end if;
  v_count:=v_count+1;
 end loop;
 return v_count;
end; $$;
-- Existing service-only grants on ingest_cf_page are retained by CREATE OR REPLACE.
