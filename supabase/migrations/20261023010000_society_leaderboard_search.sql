-- Search the full ranked society set while retaining each society's global rank.
create function public.search_society_leaderboard(
  p_metric text, p_country text, p_college uuid, p_society uuid,
  p_limit integer, p_offset integer, p_search text
) returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare v_result jsonb;
begin
  if p_metric not in ('chakra','codeforces_rating','leetcode_rating','unique_solves')
    or p_limit not between 1 and 100 or p_offset not between 0 and 100000
    or p_country is not null and p_country !~ '^[A-Z]{2}$'
    or length(trim(p_search)) not between 1 and 80
  then raise exception 'Choose supported ranking filters'; end if;

  with eligible as (
    select pr.id, pr.college_id, c.name as college_name, s.last_synced_at,
      case p_metric
        when 'codeforces_rating' then (s.summary->>'rating')::numeric
        when 'leetcode_rating' then (s.summary->>'rating')::numeric
        when 'chakra' then coalesce((select sum(delta) from public.chakra_ledger
          where user_id=pr.id and (p_society is null or created_at >= (
            select effective_from from public.memberships where user_id=pr.id and society_id=p_society
              and status='active' and competitive and effective_to is null limit 1))),0)
        else (select count(*) from public.solves where user_id=pr.id and proof_status='verified'
          and (p_society is null or first_accepted_at >= (
            select effective_from from public.memberships where user_id=pr.id and society_id=p_society
              and status='active' and competitive and effective_to is null limit 1)))
      end as score
    from public.profiles pr
    join public.coding_profiles cp on cp.user_id=pr.id and cp.platform=case when p_metric='leetcode_rating' then 'leetcode' else 'codeforces' end
    join public.provider_snapshots s on s.user_id=pr.id and s.provider=cp.platform
    left join public.colleges c on c.id=pr.college_id and c.status='approved'
    where pr.is_public and pr.username is not null and pr.onboarding_completed_at is not null
      and s.last_synced_at>now()-interval '7 days'
      and (p_metric not in ('chakra','unique_solves') or s.history_complete)
      and (p_metric not in ('codeforces_rating','leetcode_rating') or jsonb_typeof(s.summary->'rating')='number')
      and (p_country is null or pr.country_code=p_country)
      and (p_college is null or pr.college_id=p_college)
      and (p_society is null or exists (
        select 1 from public.memberships m join public.societies so on so.id=m.society_id and so.status='approved'
        where m.user_id=pr.id and m.society_id=p_society and m.status='active' and m.competitive and m.effective_to is null))
  ), society_values as (
    select so.id,so.slug,so.name,c.name as college_name,e.id as user_id,e.last_synced_at,
      case when p_metric='chakra' then coalesce((select sum(delta) from public.chakra_ledger l where l.user_id=e.id and l.created_at>=m.effective_from),0)
        when p_metric='unique_solves' then (select count(*) from public.solves sl where sl.user_id=e.id and sl.proof_status='verified' and sl.first_accepted_at>=m.effective_from)
        else e.score end as score
    from eligible e join public.memberships m on m.user_id=e.id and m.status='active' and m.competitive and m.effective_to is null and m.effective_from<=now()-interval '7 days'
    join public.societies so on so.id=m.society_id and so.status='approved'
    join public.colleges c on c.id=so.college_id and c.status='approved'
  ), society_ordered as (
    select *,row_number() over(partition by id order by score desc,user_id) as pos,
      count(*) over(partition by id) as eligible_count from society_values
  ), subjects as (
    select id,name,college_name,slug,round(avg(score),2) as score,max(eligible_count) as eligible_count,min(last_synced_at) as last_synced_at
    from society_ordered where eligible_count>=5 and pos<=10 group by id,name,college_name,slug
  ), ranked as (
    select *,row_number() over(order by score desc,name,id) as rank from subjects
  ), matches as (
    select * from ranked where position(lower(trim(p_search)) in lower(name))>0
  ), projected as (
    select rank,jsonb_build_object('rank',rank,'name',name,'username',null,'avatarUrl',null,
      'college',college_name,'slug',slug,'score',score,'eligibleCount',eligible_count) as entry from matches
  )
  select jsonb_build_object('scope','society','metric',p_metric,'computedAt',now(),
    'sourceUpdatedAt',(select min(last_synced_at) from subjects),
    'participantCount',(select count(*) from matches),
    'entries',coalesce((select jsonb_agg(entry order by rank) from (
      select * from projected order by rank limit p_limit offset p_offset) page),'[]'::jsonb),
    'podium','[]'::jsonb,'myEntry',null,
    'methodology','At least 5 eligible public members; score is the average of the top 10 eligible members (or all when fewer than 10). Global ranks are retained when searching. Society membership must be active for 7 days.',
    'minimumEligible',5,'topK',10) into v_result;
  return v_result;
end; $$;
revoke all on function public.search_society_leaderboard(text,text,uuid,uuid,integer,integer,text) from public,anon;
grant execute on function public.search_society_leaderboard(text,text,uuid,uuid,integer,integer,text) to anon,authenticated;
