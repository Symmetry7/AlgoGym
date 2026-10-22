-- Society contests use external judges or explicit administrator verification.
-- This migration deliberately does not execute participant code.
create table public.society_contests (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  title text not null check(length(title) between 3 and 160),
  description text not null default '',
  instructions text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  registration_deadline timestamptz not null,
  visibility text not null default 'members' check(visibility in ('members','invite','public_view')),
  scoring text not null default 'icpc' check(scoring in ('icpc','points')),
  wrong_penalty_minutes integer not null default 20 check(wrong_penalty_minutes between 0 and 120),
  freeze_at timestamptz,
  state text not null default 'draft' check(state in ('draft','published','finalized','archived')),
  created_by uuid not null references auth.users(id) on delete restrict,
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(ends_at>starts_at),
  check(registration_deadline<=ends_at),
  check(freeze_at is null or freeze_at between starts_at and ends_at)
);
create index society_contests_schedule on public.society_contests(society_id,starts_at desc);
create table public.society_contest_problems (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.society_contests(id) on delete cascade,
  label text not null check(label ~ '^[A-Z][A-Z]?$'),
  source text not null check(source in ('codeforces','atcoder','codechef','leetcode','custom')),
  catalog_problem_id uuid references public.problems(id) on delete set null,
  title text not null check(length(title) between 3 and 200),
  url text,
  difficulty text,
  tags text[] not null default '{}',
  score integer not null default 100 check(score between 1 and 10000),
  statement text,
  position integer not null default 0,
  evaluation text not null default 'manual' check(evaluation in ('manual','codeforces_sync')),
  unique(contest_id,label),
  unique(contest_id,source,url),
  check(source='custom' or url is not null),
  check(source<>'custom' or length(coalesce(statement,''))>=20)
);
create table public.society_contest_registrations (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.society_contests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  registered_at timestamptz not null default now(),
  unique(contest_id,user_id)
);
create table public.society_contest_submissions (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.society_contests(id) on delete cascade,
  problem_id uuid not null references public.society_contest_problems(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  proof_url text,
  provider_submission_id text,
  verdict text not null default 'pending' check(verdict in ('pending','accepted','rejected')),
  evaluation text not null default 'manual' check(evaluation in ('manual','codeforces_sync')),
  verified_by uuid references auth.users(id) on delete set null,
  submitted_at timestamptz not null default now(),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique(contest_id,user_id,problem_id,provider_submission_id)
);
create unique index contest_provider_submission_once on public.society_contest_submissions(contest_id,provider_submission_id) where provider_submission_id is not null;
create index contest_submissions_standings on public.society_contest_submissions(contest_id,user_id,problem_id,submitted_at);
create table public.society_contest_final_standings (
  contest_id uuid primary key references public.society_contests(id) on delete cascade,
  standings jsonb not null,
  finalized_at timestamptz not null default now()
);
alter table public.society_contests enable row level security;
alter table public.society_contest_problems enable row level security;
alter table public.society_contest_registrations enable row level security;
alter table public.society_contest_submissions enable row level security;
alter table public.society_contest_final_standings enable row level security;
revoke all on public.society_contests,public.society_contest_problems,public.society_contest_registrations,public.society_contest_submissions,public.society_contest_final_standings from public,anon,authenticated;
grant all on public.society_contests,public.society_contest_problems,public.society_contest_registrations,public.society_contest_submissions,public.society_contest_final_standings to service_role;

create function public.create_society_contest(p_society uuid,p_title text,p_description text,p_instructions text,p_starts_at timestamptz,p_ends_at timestamptz,p_registration_deadline timestamptz,p_scoring text,p_visibility text,p_wrong_penalty integer,p_freeze_at timestamptz default null)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid;
begin
  if not public.society_can(p_society,'manage_contests') then raise exception 'Not authorized'; end if;
  if length(trim(p_title)) not between 3 and 160 or length(coalesce(p_description,''))>5000 or length(coalesce(p_instructions,''))>10000 or p_ends_at<=p_starts_at or p_ends_at>p_starts_at+interval '14 days' or p_registration_deadline>p_ends_at or p_scoring not in ('icpc','points') or p_visibility not in ('members','invite','public_view') or p_wrong_penalty not between 0 and 120 or (p_freeze_at is not null and (p_freeze_at<p_starts_at or p_freeze_at>p_ends_at)) then raise exception 'Invalid contest details'; end if;
  insert into public.society_contests(society_id,title,description,instructions,starts_at,ends_at,registration_deadline,scoring,visibility,wrong_penalty_minutes,freeze_at,created_by)
    values(p_society,trim(p_title),coalesce(p_description,''),coalesce(p_instructions,''),p_starts_at,p_ends_at,p_registration_deadline,p_scoring,p_visibility,p_wrong_penalty,p_freeze_at,auth.uid()) returning id into v_id;
  insert into public.audit_logs(actor_id,action,object_type,object_id,metadata) values(auth.uid(),'society.contest.create','contest',v_id,jsonb_build_object('society_id',p_society));
  return v_id;
end; $$;
revoke all on function public.create_society_contest(uuid,text,text,text,timestamptz,timestamptz,timestamptz,text,text,integer,timestamptz) from public,anon;
grant execute on function public.create_society_contest(uuid,text,text,text,timestamptz,timestamptz,timestamptz,text,text,integer,timestamptz) to authenticated;

create function public.add_society_contest_problem(p_contest uuid,p_label text,p_source text,p_title text,p_url text,p_difficulty text,p_tags text[],p_score integer,p_statement text)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.society_contests; v_id uuid; v_catalog uuid; v_evaluation text:='manual';
begin
  select * into c from public.society_contests where id=p_contest for update;
  if not found or not public.society_can(c.society_id,'manage_contests') then raise exception 'Not authorized'; end if;
  if c.state<>'draft' then raise exception 'Only draft contests can be edited'; end if;
  if p_label !~ '^[A-Z][A-Z]?$' or p_source not in ('codeforces','atcoder','codechef','leetcode','custom') or length(trim(p_title)) not between 3 and 200 or p_score not between 1 and 10000 or cardinality(p_tags)>12 then raise exception 'Invalid problem details'; end if;
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
      if v_catalog is not null then v_evaluation:='codeforces_sync'; end if;
    end if;
  end if;
  insert into public.society_contest_problems(contest_id,label,source,catalog_problem_id,title,url,difficulty,tags,score,statement,position,evaluation)
    values(p_contest,p_label,p_source,v_catalog,trim(p_title),p_url,nullif(p_difficulty,''),coalesce(p_tags,'{}'),p_score,p_statement,
      (select count(*) from public.society_contest_problems where contest_id=p_contest),v_evaluation) returning id into v_id;
  return v_id;
end; $$;
revoke all on function public.add_society_contest_problem(uuid,text,text,text,text,text,text[],integer,text) from public,anon;
grant execute on function public.add_society_contest_problem(uuid,text,text,text,text,text,text[],integer,text) to authenticated;

create function public.set_society_contest_state(p_contest uuid,p_state text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.society_contests;
begin
  select * into c from public.society_contests where id=p_contest for update;
  if not found or not public.society_can(c.society_id,'manage_contests') then raise exception 'Not authorized'; end if;
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
revoke all on function public.set_society_contest_state(uuid,text) from public,anon;
grant execute on function public.set_society_contest_state(uuid,text) to authenticated;

create function public.register_society_contest(p_contest uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.society_contests;
begin
  select * into c from public.society_contests where id=p_contest;
  if not found or c.state<>'published' or now()>c.registration_deadline or now()>c.ends_at then raise exception 'Registration is closed'; end if;
  if not public.society_can(c.society_id,'view') then raise exception 'Active membership required'; end if;
  insert into public.society_contest_registrations(contest_id,user_id) values(p_contest,auth.uid()) on conflict do nothing;
end; $$;
revoke all on function public.register_society_contest(uuid) from public,anon;
grant execute on function public.register_society_contest(uuid) to authenticated;

create function public.claim_society_contest_submission(p_problem uuid,p_proof_url text)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare p public.society_contest_problems; c public.society_contests; v_id uuid;
begin
  select * into p from public.society_contest_problems where id=p_problem;
  if not found then raise exception 'Problem unavailable'; end if;
  select * into c from public.society_contests where id=p.contest_id;
  if c.state<>'published' or now()<c.starts_at or now()>c.ends_at then raise exception 'Contest is not live'; end if;
  if not exists(select 1 from public.society_contest_registrations where contest_id=c.id and user_id=auth.uid()) then raise exception 'Register to participate'; end if;
  if p_proof_url !~ '^https://[^[:space:]<>]+$' or length(p_proof_url)>500 then raise exception 'Provide a public submission URL'; end if;
  if (select count(*) from public.society_contest_submissions where user_id=auth.uid() and contest_id=c.id and created_at>now()-interval '1 hour')>=30 then raise exception 'Submission claim limit reached'; end if;
  insert into public.society_contest_submissions(contest_id,problem_id,user_id,proof_url)
    values(c.id,p.id,auth.uid(),p_proof_url) returning id into v_id;
  return v_id;
end; $$;
revoke all on function public.claim_society_contest_submission(uuid,text) from public,anon;
grant execute on function public.claim_society_contest_submission(uuid,text) to authenticated;

create function public.verify_society_contest_submission(p_submission uuid,p_accept boolean)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.society_contest_submissions; c public.society_contests;
begin
  select * into s from public.society_contest_submissions where id=p_submission and verdict='pending' for update;
  if not found then raise exception 'Pending submission unavailable'; end if;
  select * into c from public.society_contests where id=s.contest_id;
  if not public.society_can(c.society_id,'manage_contests') or c.state<>'published' then raise exception 'Not authorized'; end if;
  update public.society_contest_submissions set verdict=case when p_accept then 'accepted' else 'rejected' end,verified_by=auth.uid(),verified_at=now() where id=p_submission;
  insert into public.audit_logs(actor_id,action,object_type,object_id,metadata) values(auth.uid(),'society.contest.verify','submission',p_submission,jsonb_build_object('society_id',c.society_id,'accepted',p_accept,'contest_id',c.id));
end; $$;
revoke all on function public.verify_society_contest_submission(uuid,boolean) from public,anon;
grant execute on function public.verify_society_contest_submission(uuid,boolean) to authenticated;

create function public.sync_society_codeforces_submissions(p_contest uuid)
returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.society_contests; v_count integer;
begin
  select * into c from public.society_contests where id=p_contest;
  if not found or not public.society_can(c.society_id,'manage_contests') or c.state<>'published' then raise exception 'Not authorized'; end if;
  insert into public.society_contest_submissions(contest_id,problem_id,user_id,provider_submission_id,verdict,evaluation,submitted_at,verified_at)
    select c.id,p.id,ps.user_id,ps.provider_submission_id,
      case when ps.verdict='OK' then 'accepted' else 'rejected' end,'codeforces_sync',ps.submitted_at,ps.fetched_at
    from public.society_contest_problems p join public.provider_submissions ps on ps.problem_id=p.catalog_problem_id and ps.provider='codeforces'
    join public.society_contest_registrations r on r.user_id=ps.user_id and r.contest_id=c.id
    where p.contest_id=c.id and p.evaluation='codeforces_sync' and ps.submitted_at between c.starts_at and c.ends_at and ps.verdict not in ('TESTING','SKIPPED')
    on conflict (contest_id,provider_submission_id) where provider_submission_id is not null do nothing;
  get diagnostics v_count=row_count;
  return v_count;
end; $$;
revoke all on function public.sync_society_codeforces_submissions(uuid) from public,anon;
grant execute on function public.sync_society_codeforces_submissions(uuid) to authenticated;

create function public.read_society_contests(p_society uuid)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
  if not public.society_can(p_society,'view') then raise exception 'Active membership required'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'title',c.title,'description',c.description,'startsAt',c.starts_at,'endsAt',c.ends_at,'state',c.state,'scoring',c.scoring,'problemCount',(select count(*) from public.society_contest_problems p where p.contest_id=c.id),'registrationCount',(select count(*) from public.society_contest_registrations r where r.contest_id=c.id)) order by c.starts_at desc)
    from public.society_contests c where c.society_id=p_society and (c.state<>'draft' or public.society_can(p_society,'manage_contests'))),'[]'::jsonb);
end; $$;
revoke all on function public.read_society_contests(uuid) from public,anon;
grant execute on function public.read_society_contests(uuid) to authenticated;

create function public.read_society_contest(p_contest uuid)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare c public.society_contests;
begin
  select * into c from public.society_contests where id=p_contest;
  if not found or not public.society_can(c.society_id,'view') or (c.state='draft' and not public.society_can(c.society_id,'manage_contests')) then raise exception 'Contest unavailable'; end if;
  return jsonb_build_object('id',c.id,'societyId',c.society_id,'title',c.title,'description',c.description,'instructions',c.instructions,'startsAt',c.starts_at,'endsAt',c.ends_at,'registrationDeadline',c.registration_deadline,'visibility',c.visibility,'scoring',c.scoring,'wrongPenaltyMinutes',c.wrong_penalty_minutes,'freezeAt',c.freeze_at,'state',c.state,'serverNow',now(),'registered',exists(select 1 from public.society_contest_registrations where contest_id=c.id and user_id=auth.uid()),
    'problems',case when now()>=c.starts_at or public.society_can(c.society_id,'manage_contests') then coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'label',p.label,'source',p.source,'title',p.title,'url',p.url,'difficulty',p.difficulty,'tags',p.tags,'score',p.score,'statement',p.statement,'evaluation',p.evaluation) order by p.position,p.label) from public.society_contest_problems p where p.contest_id=c.id),'[]'::jsonb) else '[]'::jsonb end,
    'mySubmissions',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'problemId',s.problem_id,'verdict',s.verdict,'evaluation',s.evaluation,'submittedAt',s.submitted_at,'proofUrl',s.proof_url) order by s.submitted_at desc) from public.society_contest_submissions s where s.contest_id=c.id and s.user_id=auth.uid()),'[]'::jsonb),
    'pendingSubmissions',case when public.society_can(c.society_id,'manage_contests') then coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'problemId',s.problem_id,'problemLabel',p.label,'name',coalesce(pr.display_name,pr.username,'Member'),'username',pr.username,'proofUrl',s.proof_url,'submittedAt',s.submitted_at) order by s.submitted_at) from public.society_contest_submissions s join public.society_contest_problems p on p.id=s.problem_id join public.profiles pr on pr.id=s.user_id where s.contest_id=c.id and s.verdict='pending'),'[]'::jsonb) else '[]'::jsonb end);
end; $$;
revoke all on function public.read_society_contest(uuid) from public,anon;
grant execute on function public.read_society_contest(uuid) to authenticated;

create function public.read_society_contest_standings(p_contest uuid)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare c public.society_contests; v_cutoff timestamptz;
begin
  select * into c from public.society_contests where id=p_contest;
  if not found or not public.society_can(c.society_id,'view') or c.state='draft' then raise exception 'Contest unavailable'; end if;
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
revoke all on function public.read_society_contest_standings(uuid) from public,anon;
grant execute on function public.read_society_contest_standings(uuid) to authenticated;
