-- New contest selections use verified Codeforces catalog identities. Existing
-- historical problems and submissions are retained for archive access.
alter table public.society_contest_registrations add column if not exists cf_handle text;
alter table public.society_contests add column cf_verified_only boolean not null default false;
alter table public.society_contests alter column cf_verified_only set default true;
create table public.society_contest_sync_state (
  contest_id uuid not null references public.society_contests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  next_from integer not null default 1 check(next_from>=1),
  complete boolean not null default false,
  last_synced_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key(contest_id,user_id)
);
alter table public.society_contest_sync_state enable row level security;
revoke all on public.society_contest_sync_state from public,anon,authenticated;
grant all on public.society_contest_sync_state to service_role;
create table public.society_contest_editors (
  contest_id uuid not null references public.society_contests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  assigned_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key(contest_id,user_id)
);
alter table public.society_contest_editors enable row level security;
revoke all on public.society_contest_editors from public,anon,authenticated;
grant all on public.society_contest_editors to service_role;

create function public.contest_can_edit(p_contest uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select exists (
    select 1 from public.society_contests c
    where c.id=p_contest and auth.uid() is not null
      and (public.society_can(c.society_id,'admin')
        or (c.created_by=auth.uid() and public.society_can(c.society_id,'manage_contests'))
        or (public.society_can(c.society_id,'view') and exists(
          select 1 from public.society_contest_editors e where e.contest_id=c.id and e.user_id=auth.uid()))
      )
  );
$$;
revoke all on function public.contest_can_edit(uuid) from public,anon;
grant execute on function public.contest_can_edit(uuid) to authenticated;

create function public.contest_problem_visible(p_contest uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select exists (
    select 1 from public.society_contests c
    where c.id=p_contest and public.society_can(c.society_id,'view')
      and (public.contest_can_edit(c.id) or (c.state<>'draft' and now()>=c.starts_at))
  );
$$;
revoke all on function public.contest_problem_visible(uuid) from public,anon;
grant execute on function public.contest_problem_visible(uuid) to authenticated;

create function public.set_society_contest_editor(p_contest uuid,p_user uuid,p_approved boolean)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.society_contests;
begin
  select * into c from public.society_contests where id=p_contest for update;
  if not found or not public.society_can(c.society_id,'admin') then raise exception 'Not authorized'; end if;
  if p_user is null or p_user=c.created_by or not exists(
    select 1 from public.memberships m where m.society_id=c.society_id and m.user_id=p_user
      and m.status='active' and m.effective_to is null
  ) then raise exception 'Choose an active society member'; end if;
  if p_approved then
    insert into public.society_contest_editors(contest_id,user_id,assigned_by)
      values(p_contest,p_user,auth.uid()) on conflict(contest_id,user_id) do nothing;
  else
    delete from public.society_contest_editors where contest_id=p_contest and user_id=p_user;
  end if;
  insert into public.audit_logs(actor_id,action,object_type,object_id,metadata)
    values(auth.uid(),'society.contest.editor','contest',p_contest,jsonb_build_object('editor_id',p_user,'approved',p_approved));
end; $$;
revoke all on function public.set_society_contest_editor(uuid,uuid,boolean) from public,anon;
grant execute on function public.set_society_contest_editor(uuid,uuid,boolean) to authenticated;

create function public.update_society_contest(p_contest uuid,p_title text,p_description text,p_instructions text,p_starts_at timestamptz,p_ends_at timestamptz,p_registration_deadline timestamptz,p_scoring text,p_visibility text,p_wrong_penalty integer,p_freeze_at timestamptz)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.society_contests;
begin
  select * into c from public.society_contests where id=p_contest for update;
  if not found or not public.contest_can_edit(c.id) then raise exception 'Not authorized'; end if;
  if c.state<>'draft' then raise exception 'Only draft contests can be edited'; end if;
  if length(trim(p_title)) not between 3 and 160 or length(coalesce(p_description,''))>5000 or length(coalesce(p_instructions,''))>10000
    or p_ends_at<=p_starts_at or p_ends_at>p_starts_at+interval '14 days' or p_registration_deadline>p_starts_at
    or p_scoring not in ('icpc','points') or p_visibility not in ('members','invite','public_view')
    or p_wrong_penalty not between 0 and 120
    or (p_freeze_at is not null and (p_freeze_at<p_starts_at or p_freeze_at>p_ends_at))
  then raise exception 'Invalid contest details'; end if;
  update public.society_contests set title=trim(p_title),description=coalesce(p_description,''),instructions=coalesce(p_instructions,''),
    starts_at=p_starts_at,ends_at=p_ends_at,registration_deadline=p_registration_deadline,scoring=p_scoring,
    visibility=p_visibility,wrong_penalty_minutes=p_wrong_penalty,freeze_at=p_freeze_at,updated_at=now() where id=p_contest;
  insert into public.audit_logs(actor_id,action,object_type,object_id,metadata)
    values(auth.uid(),'society.contest.update','contest',p_contest,jsonb_build_object('society_id',c.society_id));
end; $$;
revoke all on function public.update_society_contest(uuid,text,text,text,timestamptz,timestamptz,timestamptz,text,text,integer,timestamptz) from public,anon;
grant execute on function public.update_society_contest(uuid,text,text,text,timestamptz,timestamptz,timestamptz,text,text,integer,timestamptz) to authenticated;

create function public.remove_society_contest_problem(p_problem uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.society_contests;
begin
  select c.* into c from public.society_contests c join public.society_contest_problems p on p.contest_id=c.id where p.id=p_problem for update of c;
  if not found or not public.contest_can_edit(c.id) then raise exception 'Not authorized'; end if;
  if c.state<>'draft' then raise exception 'Only draft contests can be edited'; end if;
  delete from public.society_contest_problems where id=p_problem;
end; $$;
revoke all on function public.remove_society_contest_problem(uuid) from public,anon;
grant execute on function public.remove_society_contest_problem(uuid) to authenticated;

alter table public.society_contest_problems drop constraint society_contest_problems_contest_id_label_key;
alter table public.society_contest_problems add constraint society_contest_problems_contest_id_label_key unique(contest_id,label) deferrable initially deferred;
create function public.reorder_society_contest_problems(p_contest uuid,p_items jsonb)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.society_contests; v_count integer;
begin
  select * into c from public.society_contests where id=p_contest for update;
  if not found or not public.contest_can_edit(c.id) then raise exception 'Not authorized'; end if;
  if c.state<>'draft' then raise exception 'Only draft contests can be edited'; end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)>26 then raise exception 'Invalid problem order'; end if;
  select count(*) into v_count from public.society_contest_problems where contest_id=p_contest;
  if jsonb_array_length(p_items)<>v_count or (select count(distinct value->>'id') from jsonb_array_elements(p_items))<>v_count
    or exists(select 1 from jsonb_array_elements(p_items) item where not exists(
      select 1 from public.society_contest_problems p where p.contest_id=p_contest and p.id::text=(item.value->>'id')
    )) then raise exception 'Problem order must include each selected problem once'; end if;
  if exists(select 1 from jsonb_array_elements(p_items) item where (item.value->>'score')::integer not between 1 and 10000)
    then raise exception 'Invalid problem points'; end if;
  update public.society_contest_problems p set position=x.ordinal-1,label=chr((64+x.ordinal)::integer),score=(x.value->>'score')::integer
    from jsonb_array_elements(p_items) with ordinality as x(value,ordinal)
    where p.id=(x.value->>'id')::uuid and p.contest_id=p_contest;
end; $$;
revoke all on function public.reorder_society_contest_problems(uuid,jsonb) from public,anon;
grant execute on function public.reorder_society_contest_problems(uuid,jsonb) to authenticated;

create or replace function public.read_society_contests(p_society uuid)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
  if not public.society_can(p_society,'view') then raise exception 'Active membership required'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'title',c.title,'description',c.description,'startsAt',c.starts_at,'endsAt',c.ends_at,'state',c.state,'scoring',c.scoring,'problemCount',case when public.contest_problem_visible(c.id) then (select count(*) from public.society_contest_problems p where p.contest_id=c.id) else null end,'registrationCount',(select count(*) from public.society_contest_registrations r where r.contest_id=c.id)) order by c.starts_at desc)
    from public.society_contests c where c.society_id=p_society and (c.state<>'draft' or public.contest_can_edit(c.id))),'[]'::jsonb);
end; $$;

create or replace function public.read_society_contest(p_contest uuid)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare c public.society_contests;
begin
  select * into c from public.society_contests where id=p_contest;
  if not found or not public.society_can(c.society_id,'view') or (c.state='draft' and not public.contest_can_edit(c.id)) then raise exception 'Contest unavailable'; end if;
  return jsonb_build_object('id',c.id,'societyId',c.society_id,'title',c.title,'description',c.description,'instructions',c.instructions,'startsAt',c.starts_at,'endsAt',c.ends_at,'registrationDeadline',c.registration_deadline,'visibility',c.visibility,'scoring',c.scoring,'wrongPenaltyMinutes',c.wrong_penalty_minutes,'freezeAt',c.freeze_at,'state',c.state,'cfVerifiedOnly',c.cf_verified_only,'serverNow',now(),'registered',exists(select 1 from public.society_contest_registrations where contest_id=c.id and user_id=auth.uid()),'canEdit',public.contest_can_edit(c.id),
    'problems',case when public.contest_problem_visible(c.id) then coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'label',p.label,'source',p.source,'title',p.title,'url',p.url,'difficulty',p.difficulty,'tags',p.tags,'score',p.score,'statement',p.statement,'evaluation',p.evaluation) order by p.position,p.label) from public.society_contest_problems p where p.contest_id=c.id),'[]'::jsonb) else '[]'::jsonb end,
    'mySubmissions',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'problemId',s.problem_id,'verdict',s.verdict,'evaluation',s.evaluation,'submittedAt',s.submitted_at,'proofUrl',s.proof_url) order by s.submitted_at desc) from public.society_contest_submissions s where s.contest_id=c.id and s.user_id=auth.uid()),'[]'::jsonb),
    'pendingSubmissions',case when public.contest_can_edit(c.id) then coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'problemId',s.problem_id,'problemLabel',p.label,'name',coalesce(pr.display_name,pr.username,'Member'),'username',pr.username,'proofUrl',s.proof_url,'submittedAt',s.submitted_at) order by s.submitted_at) from public.society_contest_submissions s join public.society_contest_problems p on p.id=s.problem_id join public.profiles pr on pr.id=s.user_id where s.contest_id=c.id and s.verdict='pending'),'[]'::jsonb) else '[]'::jsonb end);
end; $$;

create or replace function public.read_society_contest_standings(p_contest uuid)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare c public.society_contests; v_cutoff timestamptz;
begin
  select * into c from public.society_contests where id=p_contest;
  if not found or not public.society_can(c.society_id,'view') or (c.state='draft' and not public.contest_can_edit(c.id)) then raise exception 'Contest unavailable'; end if;
  if not public.contest_problem_visible(c.id) then return jsonb_build_object('updatedAt',now(),'frozen',false,'entries','[]'::jsonb); end if;
  if c.state in ('finalized','archived') and exists(select 1 from public.society_contest_final_standings where contest_id=p_contest) then
    return (select standings from public.society_contest_final_standings where contest_id=p_contest);
  end if;
  v_cutoff:=case when c.freeze_at is not null and now()>=c.freeze_at and c.state='published' then c.freeze_at else c.ends_at end;
  return jsonb_build_object('updatedAt',now(),'frozen',v_cutoff=c.freeze_at and c.state='published',
    'entries',coalesce((with attempts as (
      select s.user_id,s.problem_id,min(s.submitted_at) filter(where s.verdict='accepted') accepted_at,
        count(*) filter(where s.verdict='rejected' and s.submitted_at<coalesce((select min(a.submitted_at) from public.society_contest_submissions a where a.user_id=s.user_id and a.problem_id=s.problem_id and a.contest_id=p_contest and a.verdict='accepted' and a.submitted_at<=v_cutoff),v_cutoff+interval '1 microsecond')) wrong_before
      from public.society_contest_submissions s where s.contest_id=p_contest and s.verdict<>'pending' and s.submitted_at<=v_cutoff group by s.user_id,s.problem_id
    ), totals as (
      select r.user_id,count(a.accepted_at)::integer solved,coalesce(sum(case when a.accepted_at is not null then p.score else 0 end),0)::integer score,
        coalesce(sum(case when a.accepted_at is not null then floor(extract(epoch from (a.accepted_at-c.starts_at))/60)::integer+c.wrong_penalty_minutes*a.wrong_before else 0 end),0)::integer penalty,
        max(a.accepted_at) last_accepted_at,
        jsonb_object_agg(p.label,jsonb_build_object('verdict',case when a.accepted_at is not null then 'accepted' when a.wrong_before>0 then 'rejected' else null end,'wrongAttempts',coalesce(a.wrong_before,0),'acceptedAt',a.accepted_at)) problems
      from public.society_contest_registrations r cross join public.society_contest_problems p left join attempts a on a.user_id=r.user_id and a.problem_id=p.id
      where r.contest_id=p_contest and p.contest_id=p_contest group by r.user_id
    ), ranked as (
      select row_number() over(order by case when c.scoring='icpc' then solved else score end desc,
        case when c.scoring='icpc' then penalty else coalesce(extract(epoch from last_accepted_at),0) end asc,user_id)::integer rank,
        t.*,coalesce(pr.display_name,pr.username,'Member') name,pr.username
      from totals t join public.profiles pr on pr.id=t.user_id
    ) select jsonb_agg(jsonb_build_object('rank',rank,'userId',user_id,'name',name,'username',username,'solved',solved,'score',score,'penalty',penalty,'problems',problems) order by rank) from ranked),'[]'::jsonb));
end; $$;

create or replace function public.create_society_contest(p_society uuid,p_title text,p_description text,p_instructions text,p_starts_at timestamptz,p_ends_at timestamptz,p_registration_deadline timestamptz,p_scoring text,p_visibility text,p_wrong_penalty integer,p_freeze_at timestamptz default null)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid;
begin
  if not public.society_can(p_society,'manage_contests') then raise exception 'Not authorized'; end if;
  if length(trim(p_title)) not between 3 and 160 or length(coalesce(p_description,''))>5000 or length(coalesce(p_instructions,''))>10000 or p_ends_at<=p_starts_at or p_ends_at>p_starts_at+interval '14 days' or p_registration_deadline>p_starts_at or p_scoring not in ('icpc','points') or p_visibility not in ('members','invite','public_view') or p_wrong_penalty not between 0 and 120 or (p_freeze_at is not null and (p_freeze_at<p_starts_at or p_freeze_at>p_ends_at)) then raise exception 'Invalid contest details'; end if;
  insert into public.society_contests(society_id,title,description,instructions,starts_at,ends_at,registration_deadline,scoring,visibility,wrong_penalty_minutes,freeze_at,created_by)
    values(p_society,trim(p_title),coalesce(p_description,''),coalesce(p_instructions,''),p_starts_at,p_ends_at,p_registration_deadline,p_scoring,p_visibility,p_wrong_penalty,p_freeze_at,auth.uid()) returning id into v_id;
  insert into public.audit_logs(actor_id,action,object_type,object_id,metadata) values(auth.uid(),'society.contest.create','contest',v_id,jsonb_build_object('society_id',p_society));
  return v_id;
end; $$;

create or replace function public.register_society_contest(p_contest uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.society_contests; v_handle text;
begin
  select * into c from public.society_contests where id=p_contest;
  if not found or c.state<>'published' or now()>c.registration_deadline or now()>c.ends_at then raise exception 'Registration is closed'; end if;
  if not public.society_can(c.society_id,'view') then raise exception 'Active membership required'; end if;
  select username into v_handle from public.coding_profiles where user_id=auth.uid() and platform='codeforces' and verified_at is not null;
  if v_handle is null then raise exception 'Connect a verified Codeforces handle before registering'; end if;
  insert into public.society_contest_registrations(contest_id,user_id,cf_handle) values(p_contest,auth.uid(),v_handle) on conflict do nothing;
end; $$;

create or replace function public.set_society_contest_state(p_contest uuid,p_state text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.society_contests;
begin
  select * into c from public.society_contests where id=p_contest for update;
  if not found or not public.contest_can_edit(c.id) then raise exception 'Not authorized'; end if;
  if not ((c.state='draft' and p_state='published' and c.ends_at>now()) or (c.state='published' and p_state='finalized' and c.ends_at<=now()) or (c.state='finalized' and p_state='archived')) then raise exception 'Invalid contest transition'; end if;
  if p_state='published' and not exists(select 1 from public.society_contest_problems where contest_id=p_contest) then raise exception 'Add at least one problem'; end if;
  if p_state='finalized' and exists(select 1 from public.society_contest_submissions where contest_id=p_contest and verdict='pending') then raise exception 'Review pending submissions before finalizing'; end if;
  update public.society_contests set state=p_state,finalized_at=case when p_state='finalized' then now() else finalized_at end,updated_at=now() where id=p_contest;
  if p_state='finalized' then
    insert into public.society_contest_final_standings(contest_id,standings) values(p_contest,public.read_society_contest_standings(p_contest));
  end if;
  if p_state in ('published','finalized') then
    insert into public.society_notifications(society_id,recipient_id,event_key,kind,title,body,href)
      select c.society_id,m.user_id,'contest:'||p_contest::text||':'||p_state,
        case when p_state='published' then 'contest_published' else 'contest_results' end,
        case when p_state='published' then 'New society contest: '||c.title else 'Contest results: '||c.title end,
        case when p_state='published' then 'Registration is open.' else 'Final standings are available.' end,
        '/societies/'||(select slug from public.societies where id=c.society_id)||'/contests/'||p_contest::text
      from public.memberships m where m.society_id=c.society_id and m.status='active' and m.effective_to is null
      on conflict(recipient_id,event_key) do nothing;
  end if;
  insert into public.audit_logs(actor_id,action,object_type,object_id,metadata) values(auth.uid(),'society.contest.state','contest',p_contest,jsonb_build_object('society_id',c.society_id,'state',p_state));
end; $$;

create or replace function public.add_society_contest_problem(p_contest uuid,p_label text,p_source text,p_title text,p_url text,p_difficulty text,p_tags text[],p_score integer,p_statement text)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.society_contests; v_id uuid; v_catalog uuid; v_evaluation text:='manual';
begin
  select * into c from public.society_contests where id=p_contest for update;
  if not found or not public.contest_can_edit(c.id) then raise exception 'Not authorized'; end if;
  if c.state<>'draft' then raise exception 'Only draft contests can be edited'; end if;
  if p_label !~ '^[A-Z][A-Z]?$' or p_source<>'codeforces' or length(trim(p_title)) not between 3 and 200 or p_score not between 1 and 10000 or cardinality(p_tags)>12 then raise exception 'Invalid problem details'; end if;
  if p_source='custom' then
    if length(coalesce(p_statement,''))<20 then raise exception 'Custom problems need a statement'; end if;
    p_url:=null;
  else
    if p_url !~ '^https://[^[:space:]<>]+$' or length(p_url)>500 then raise exception 'Enter a public HTTPS problem URL'; end if;
    if p_source='codeforces' and p_url !~ '^https://(www\.)?codeforces\.com/(problemset/problem|contest|gym)/' or
       p_source='atcoder' and p_url !~ '^https://atcoder\.jp/contests/[^/]+/tasks/' or
       p_source='codechef' and p_url !~ '^https://(www\.)?codechef\.com/problems/' or
       p_source='leetcode' and p_url !~ '^https://leetcode\.com/problems/' then raise exception 'Problem URL does not match its source'; end if;
    if p_source='codeforces' then
      select id into v_catalog from public.problems where provider='codeforces' and url=trim(trailing '/' from p_url) limit 1;
      if v_catalog is null then raise exception 'Import the Codeforces problem from the verified catalog first'; end if;
      v_evaluation:='codeforces_sync';
    end if;
  end if;
  insert into public.society_contest_problems(contest_id,label,source,catalog_problem_id,title,url,difficulty,tags,score,statement,position,evaluation)
    values(p_contest,p_label,p_source,v_catalog,(select title from public.problems where id=v_catalog),p_url,nullif(p_difficulty,''),coalesce(p_tags,'{}'),p_score,p_statement,
      (select count(*) from public.society_contest_problems where contest_id=p_contest),v_evaluation) returning id into v_id;
  return v_id;
end; $$;

-- Verified handles are fixed when the student registers. Backfill existing
-- registrations from a currently verified account for legacy records only.
update public.society_contest_registrations r set cf_handle=cp.username
  from public.coding_profiles cp
  where r.user_id=cp.user_id and cp.platform='codeforces' and cp.verified_at is not null and r.cf_handle is null;

create function public.ingest_society_cf_submissions(p_contest uuid,p_user uuid,p_handle text,p_submissions jsonb)
returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.society_contests; item jsonb; v_problem uuid; v_verdict text; v_count integer:=0;
begin
  select * into c from public.society_contests where id=p_contest;
  if not found or c.state<>'published' then raise exception 'Contest unavailable'; end if;
  if not exists(select 1 from public.society_contest_registrations r
    join public.coding_profiles cp on cp.user_id=r.user_id and cp.platform='codeforces' and cp.verified_at is not null
    where r.contest_id=p_contest and r.user_id=p_user and lower(r.cf_handle)=lower(p_handle)
      and lower(cp.username)=lower(r.cf_handle)) then raise exception 'Verified contest handle mismatch'; end if;
  if jsonb_typeof(p_submissions)<>'array' or jsonb_array_length(p_submissions)>500 then raise exception 'Invalid Codeforces submission page'; end if;
  for item in select value from jsonb_array_elements(p_submissions) loop
    if not (item ? 'id' and item ? 'contestId' and item ? 'index' and item ? 'submittedAt') then continue; end if;
    select p.id into v_problem from public.society_contest_problems p
      join public.problems catalog on catalog.id=p.catalog_problem_id
      where p.contest_id=p_contest and p.source='codeforces'
        and catalog.external_problem_id=(item->>'contestId')||':'||(item->>'index') limit 1;
    if v_problem is null or (item->>'submittedAt')::timestamptz<c.starts_at
      or (item->>'submittedAt')::timestamptz>c.ends_at then continue; end if;
    v_verdict:=case when item->>'verdict'='OK' then 'accepted'
      when item->>'verdict' in ('TESTING','SUBMITTED','') or item->>'verdict' is null then 'pending'
      else 'rejected' end;
    insert into public.society_contest_submissions(contest_id,problem_id,user_id,provider_submission_id,verdict,evaluation,submitted_at,verified_at)
      values(p_contest,v_problem,p_user,item->>'id',v_verdict,'codeforces_sync',(item->>'submittedAt')::timestamptz,
        case when v_verdict='pending' then null else now() end)
      on conflict (contest_id,provider_submission_id) where provider_submission_id is not null
      do update set verdict=excluded.verdict,verified_at=excluded.verified_at
        where society_contest_submissions.user_id=excluded.user_id and society_contest_submissions.problem_id=excluded.problem_id;
    v_count:=v_count+1;
  end loop;
  return v_count;
end; $$;
revoke all on function public.ingest_society_cf_submissions(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.ingest_society_cf_submissions(uuid,uuid,text,jsonb) to service_role;

-- New Codeforces-only contests never accept self-reported proof or a manager's
-- manual AC decision. Historical contests retain their earlier review path.
create or replace function public.claim_society_contest_submission(p_problem uuid,p_proof_url text)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare p public.society_contest_problems;c public.society_contests;v_id uuid;
begin
  select * into p from public.society_contest_problems where id=p_problem;
  if not found then raise exception 'Problem unavailable'; end if;
  select * into c from public.society_contests where id=p.contest_id;
  if c.cf_verified_only then raise exception 'Codeforces submissions are verified automatically'; end if;
  if c.state<>'published' or now()<c.starts_at or now()>c.ends_at then raise exception 'Contest is not live'; end if;
  if not exists(select 1 from public.society_contest_registrations where contest_id=c.id and user_id=auth.uid()) then raise exception 'Register to participate'; end if;
  if p_proof_url !~ '^https://[^[:space:]<>]+$' or length(p_proof_url)>500 then raise exception 'Provide a public submission URL'; end if;
  if (select count(*) from public.society_contest_submissions where user_id=auth.uid() and contest_id=c.id and created_at>now()-interval '1 hour')>=30 then raise exception 'Submission claim limit reached'; end if;
  insert into public.society_contest_submissions(contest_id,problem_id,user_id,proof_url)
    values(c.id,p.id,auth.uid(),p_proof_url) returning id into v_id;
  return v_id;
end; $$;
revoke execute on function public.sync_society_codeforces_submissions(uuid) from authenticated;
