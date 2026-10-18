-- Version 1: 25 Chakra for a completed competitive module backed by a new eligible verified solve.
create table public.ai_module_awards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  module_id uuid not null references public.ai_learning_modules(id) on delete restrict,
  solve_id uuid not null references public.solves(id) on delete restrict,
  policy_version text not null default 'symm-module-v1',
  points integer not null check (points > 0),
  awarded_at timestamptz not null default now(),
  unique(user_id,module_id),
  unique(user_id,solve_id)
);
alter table public.ai_module_awards enable row level security;
create policy ai_own_module_awards on public.ai_module_awards for select to authenticated using (user_id=(select auth.uid()));
revoke all on public.ai_module_awards from public,anon,authenticated;
grant select on public.ai_module_awards to authenticated;
grant all on public.ai_module_awards to service_role;

create function public.claim_symm_module_award(p_module uuid)
returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare v_user uuid:=auth.uid(); v_path record; v_solve uuid; v_award uuid; v_points integer:=25;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select p.id,p.user_id,p.category,p.created_at into v_path
  from public.ai_learning_modules m join public.ai_learning_paths p on p.id=m.path_id
  where m.id=p_module;
  if not found or v_path.user_id<>v_user then raise exception 'Module not found'; end if;
  if v_path.category<>'competitive' then raise exception 'Practice rewards apply only to competitive modules'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text||':symm-module-awards',0));
  if exists(select 1 from public.ai_module_awards where user_id=v_user and module_id=p_module) then return 0; end if;
  if not exists(select 1 from public.ai_learning_lessons where module_id=p_module)
    or exists(select 1 from public.ai_learning_lessons l where l.module_id=p_module and (l.status<>'ready' or not exists(select 1 from public.ai_learning_progress pr where pr.user_id=v_user and pr.lesson_id=l.id)))
  then raise exception 'Complete every lesson first'; end if;
  select s.id into v_solve from public.ai_recommended_problems r
  join public.solves s on s.problem_id=r.problem_id and s.user_id=v_user and s.proof_status='verified'
  join public.chakra_awards a on a.solve_id=s.id and a.user_id=v_user
  where r.module_id=p_module and s.first_accepted_at>=v_path.created_at
    and not exists(select 1 from public.ai_module_awards prior where prior.user_id=v_user and prior.solve_id=s.id)
  order by s.first_accepted_at limit 1;
  if v_solve is null then raise exception 'A new eligible verified practice solve is required'; end if;
  insert into public.ai_module_awards(user_id,module_id,solve_id,points)
  values(v_user,p_module,v_solve,v_points) returning id into v_award;
  insert into public.chakra_ledger(user_id,entry_type,delta,reason,actor_id)
  values(v_user,'grant',v_points,'Symm AI competitive module reward v1: '||v_award::text,v_user);
  insert into public.chakra_balance_cache(user_id,balance)
  values(v_user,v_points) on conflict(user_id) do update set balance=chakra_balance_cache.balance+excluded.balance,refreshed_at=now();
  return v_points;
end;$$;
revoke all on function public.claim_symm_module_award(uuid) from public,anon,authenticated;
grant execute on function public.claim_symm_module_award(uuid) to authenticated;
