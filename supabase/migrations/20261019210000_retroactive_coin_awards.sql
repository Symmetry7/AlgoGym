-- Coin branding retains the existing ledger and unique award constraints.
-- A provider-reported accepted Codeforces submission is eligible even when it
-- predates AlgoGym registration or coding-profile verification.
create or replace function public.award_pending_cf_solves(p_user_id uuid)
returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare
  s record;
  policy public.chakra_policies;
  bracket jsonb;
  v_points integer;
  v_award uuid;
  v_count integer := 0;
begin
  select * into policy from public.chakra_policies
   where status = 'active' and effective_at <= now()
   order by effective_at desc limit 1;
  if not found then return 0; end if;

  for s in
    select so.*, p.cf_rating
      from public.solves so
      join public.problems p on p.id = so.problem_id and p.provider = 'codeforces'
      join public.coding_profiles cp on cp.user_id = so.user_id
        and cp.platform = 'codeforces' and cp.verified_at is not null
     where so.user_id = p_user_id and so.proof_status = 'verified'
       and not exists (
         select 1 from public.chakra_awards a
          where a.user_id = so.user_id and a.problem_id = so.problem_id
       )
  loop
    v_points := null;
    for bracket in select value from jsonb_array_elements(policy.cf_brackets) loop
      if s.cf_rating between (bracket->>0)::integer and (bracket->>1)::integer then
        v_points := (bracket->>2)::integer;
        exit;
      end if;
    end loop;
    if v_points is null or v_points <= 0 then continue; end if;
    v_award := null;
    insert into public.chakra_awards(user_id,problem_id,solve_id,policy_id,difficulty_snapshot,points)
      values (p_user_id,s.problem_id,s.id,policy.id,jsonb_build_object('provider','codeforces','rating',s.cf_rating),v_points)
      on conflict do nothing returning id into v_award;
    if v_award is not null then
      insert into public.chakra_ledger(user_id,award_id,entry_type,delta,reason)
        values (p_user_id,v_award,'grant',v_points,'First accepted Codeforces problem, including previous history');
      insert into public.outbox_events(event_type,aggregate_id,payload)
        values ('chakra.awarded',v_award,jsonb_build_object('user_id',p_user_id,'points',v_points,'problem_id',s.problem_id));
      insert into public.chakra_balance_cache(user_id,balance)
        values (p_user_id,v_points)
        on conflict(user_id) do update
          set balance = chakra_balance_cache.balance + excluded.balance,
              refreshed_at = now();
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end; $$;
revoke all on function public.award_pending_cf_solves(uuid) from public,anon,authenticated;
grant execute on function public.award_pending_cf_solves(uuid) to service_role;

-- Existing users receive eligible historical awards when the migration runs.
do $$ declare member record; begin
  for member in select distinct user_id from public.coding_profiles
    where platform = 'codeforces' and verified_at is not null loop
    perform public.award_pending_cf_solves(member.user_id);
  end loop;
end $$;
