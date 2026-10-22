-- Period rankings count verified accepted problems only. Ratings remain separate.
create function public.read_verified_solve_leaderboard(p_period text,p_college uuid default null,p_society uuid default null,p_offset integer default 0,p_limit integer default 50)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare v_since timestamptz; v_result jsonb;
begin
  if p_period not in ('week','month') or p_offset not between 0 and 100000 or p_limit not between 1 and 100 then raise exception 'Invalid period'; end if;
  v_since:=case when p_period='week' then date_trunc('week',now()) else date_trunc('month',now()) end;
  with eligible as (
    select pr.id,pr.username,coalesce(nullif(pr.display_name,''),pr.username) name,pr.avatar_url,c.name college_name,
      (select count(*) from public.solves sl where sl.user_id=pr.id and sl.proof_status='verified' and sl.first_accepted_at>=v_since and
        (p_society is null or sl.first_accepted_at>=m.effective_from)) score,
      (select max(sl.first_accepted_at) from public.solves sl where sl.user_id=pr.id and sl.proof_status='verified') last_activity
    from public.profiles pr left join public.colleges c on c.id=pr.college_id and c.status='approved'
    left join public.memberships m on m.user_id=pr.id and m.society_id=p_society and m.status='active' and m.effective_to is null
    where pr.is_public and pr.username is not null and pr.onboarding_completed_at is not null
      and (p_college is null or pr.college_id=p_college)
      and (p_society is null or m.id is not null)
  ), ranked as (
    select row_number() over(order by score desc,name,id)::integer rank,* from eligible
  ), projected as (
    select rank,id,jsonb_build_object('rank',rank,'name',name,'username',username,'avatarUrl',avatar_url,'college',college_name,'slug',null,'score',score,'eligibleCount',1) entry from ranked
  )
  select jsonb_build_object('scope','individual','metric','unique_solves','period',p_period,'computedAt',now(),
    'sourceUpdatedAt',(select max(last_activity) from eligible),'participantCount',(select count(*) from eligible),
    'entries',coalesce((select jsonb_agg(entry order by rank) from (select * from projected order by rank limit p_limit offset p_offset) page),'[]'::jsonb),
    'podium',coalesce((select jsonb_agg(entry order by rank) from projected where rank<=3),'[]'::jsonb),
    'myEntry',(select entry from projected where id=auth.uid() limit 1),
    'methodology','Verified unique accepted problems since the start of the selected calendar period. Public profiles only. Society counts begin at active membership. Ties use name then stable account ID.',
    'minimumEligible',1,'topK',null) into v_result;
  return v_result;
end; $$;
revoke all on function public.read_verified_solve_leaderboard(text,uuid,uuid,integer,integer) from public,anon;
grant execute on function public.read_verified_solve_leaderboard(text,uuid,uuid,integer,integer) to authenticated;
