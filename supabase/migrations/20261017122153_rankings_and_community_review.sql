-- Live rankings are one MVCC-consistent projection of verified, opted-in records.
-- No proprietary universal rating is used; each metric has its own eligibility.
create function public.read_leaderboard(p_scope text default 'individual',p_metric text default 'chakra',p_country text default null,p_college uuid default null,p_society uuid default null,p_limit integer default 100,p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare v_result jsonb;
begin
 if p_scope not in ('individual','society','college') or p_metric not in ('chakra','codeforces_rating','leetcode_rating','unique_solves') or p_limit not between 1 and 100 or p_offset not between 0 and 100000 or p_country is not null and p_country !~ '^[A-Z]{2}$' then raise exception 'Choose supported ranking filters';end if;
 with eligible as (
  select pr.id,pr.username,coalesce(nullif(pr.display_name,''),pr.username) as label,pr.avatar_url,pr.country_code,pr.college_id,c.name as college_name,
   case p_metric when 'codeforces_rating' then (s.summary->>'rating')::numeric when 'leetcode_rating' then (s.summary->>'rating')::numeric
    when 'chakra' then coalesce((select sum(delta) from public.chakra_ledger where user_id=pr.id and (p_society is null or created_at>=(select effective_from from public.memberships where user_id=pr.id and society_id=p_society and status='active' and competitive and effective_to is null limit 1))),0)
    else (select count(*) from public.solves where user_id=pr.id and proof_status='verified' and (p_society is null or first_accepted_at>=(select effective_from from public.memberships where user_id=pr.id and society_id=p_society and status='active' and competitive and effective_to is null limit 1))) end as score,s.last_synced_at
  from public.profiles pr join public.coding_profiles cp on cp.user_id=pr.id and cp.platform=case when p_metric='leetcode_rating' then 'leetcode' else 'codeforces' end
  join public.provider_snapshots s on s.user_id=pr.id and s.provider=cp.platform
  left join public.colleges c on c.id=pr.college_id and c.status='approved'
  where pr.is_public and pr.username is not null and pr.onboarding_completed_at is not null and s.last_synced_at>now()-interval '7 days'
   and (p_metric not in ('chakra','unique_solves') or s.history_complete)
   and (p_metric not in ('codeforces_rating','leetcode_rating') or jsonb_typeof(s.summary->'rating')='number')
   and (p_country is null or pr.country_code=p_country) and (p_college is null or pr.college_id=p_college)
   and (p_society is null or exists(select 1 from public.memberships m join public.societies so on so.id=m.society_id and so.status='approved' where m.user_id=pr.id and m.society_id=p_society and m.status='active' and m.competitive and m.effective_to is null))
 ), society_values as (
  select so.id,so.slug,so.name,so.college_id,c.name as college_name,e.id user_id,e.last_synced_at,
   case when p_metric='chakra' then coalesce((select sum(delta) from public.chakra_ledger l where l.user_id=e.id and l.created_at>=m.effective_from),0)
   when p_metric='unique_solves' then (select count(*) from public.solves sl where sl.user_id=e.id and sl.proof_status='verified' and sl.first_accepted_at>=m.effective_from)
   else e.score end as score
  from eligible e join public.memberships m on m.user_id=e.id and m.status='active' and m.competitive and m.effective_to is null and m.effective_from<=now()-interval '7 days'
  join public.societies so on so.id=m.society_id and so.status='approved' join public.colleges c on c.id=so.college_id and c.status='approved'
 ), society_ordered as (select *,row_number() over(partition by id order by score desc,user_id) pos,count(*) over(partition by id) as eligible_count from society_values),
 college_ordered as (select *,row_number() over(partition by college_id order by score desc,id) pos,count(*) over(partition by college_id) eligible_count from eligible where college_id is not null and college_name is not null),
 subjects as (
  select id as subject_id,label as name,username,avatar_url,college_name,null::text as slug,score,1::bigint eligible_count,last_synced_at from eligible where p_scope='individual'
  union all
  select id,name,null::text,null::text,college_name,slug,round(avg(score),2),max(eligible_count),min(last_synced_at) from society_ordered where p_scope='society' and eligible_count>=5 and pos<=10 group by id,name,college_name,slug
  union all
  select college_id,college_name,null::text,null::text,college_name,null::text,round(avg(score),2),max(eligible_count),min(last_synced_at) from college_ordered where p_scope='college' and eligible_count>=5 and pos<=10 group by college_id,college_name
 ), ranked as (select *,row_number() over(order by score desc,name,subject_id) rank from subjects),
 projected as (select subject_id,rank,jsonb_build_object('rank',rank,'name',name,'username',username,'avatarUrl',avatar_url,'college',college_name,'slug',slug,'score',score,'eligibleCount',eligible_count) entry from ranked)
 select jsonb_build_object('scope',p_scope,'metric',p_metric,'computedAt',now(),'sourceUpdatedAt',(select min(last_synced_at) from subjects),'participantCount',(select count(*) from ranked),
 'entries',coalesce((select jsonb_agg(entry order by rank) from (select * from projected order by rank limit p_limit offset p_offset) page),'[]'::jsonb),
 'podium',coalesce((select jsonb_agg(entry order by rank) from projected where rank<=3),'[]'::jsonb),
 'myEntry',(select entry from projected where p_scope='individual' and subject_id=auth.uid() or p_scope='college' and subject_id=(select college_id from public.profiles where id=auth.uid()) or p_scope='society' and exists(select 1 from public.memberships m where m.user_id=auth.uid() and m.society_id=subject_id and m.status='active' and m.competitive and m.effective_to is null) limit 1),
 'methodology',case when p_scope='individual' then 'Public, onboarded members with verified metric-specific accounts synchronized in the last 7 days. Solves and Chakra require a complete Codeforces history. Ties use display name then a stable ID.' else 'At least 5 eligible public members; score is the average of the top 10 eligible members (or all when fewer than 10). Society membership must be active for 7 days; society Chakra and solve counts include only activity during current membership. College counts deduplicate users. Ties use name then a stable ID.' end,
 'minimumEligible',case when p_scope='individual' then 1 else 5 end,'topK',case when p_scope='individual' then null else 10 end) into v_result;
 return v_result;
end; $$;
revoke all on function public.read_leaderboard(text,text,text,uuid,uuid,integer,integer) from public;
grant execute on function public.read_leaderboard(text,text,text,uuid,uuid,integer,integer) to anon,authenticated;

create function public.enqueue_due_profile_syncs(p_limit integer default 100) returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare v_count integer;
begin
 if p_limit not between 1 and 1000 then raise exception 'Invalid batch size';end if;
 insert into public.sync_jobs(user_id,provider)
 select cp.user_id,cp.platform from public.coding_profiles cp left join public.provider_snapshots s on s.user_id=cp.user_id and s.provider=cp.platform
 where (s.last_synced_at is null or s.last_synced_at<now()-interval '12 hours')
 and not exists(select 1 from public.sync_jobs j where j.user_id=cp.user_id and j.provider=cp.platform and (j.status in ('queued','running','retrying') or j.created_at>now()-interval '15 minutes'))
 order by s.last_synced_at nulls first,cp.user_id,cp.platform limit p_limit on conflict do nothing;
 get diagnostics v_count=row_count;return v_count;
end; $$;
revoke all on function public.enqueue_due_profile_syncs(integer) from public,anon,authenticated;
grant execute on function public.enqueue_due_profile_syncs(integer) to service_role;

-- Existing public URLs address a society by slug. Fail rather than merge duplicates.
create unique index society_global_slug on public.societies(slug);
create policy own_society_application_read on public.society_applications for select to authenticated using(applicant_id=(select auth.uid()));
create policy own_society_read on public.societies for select to authenticated using(created_by=(select auth.uid()));
grant select on public.society_applications to authenticated;
alter table public.college_requests add column reviewed_by uuid references auth.users(id);
alter table public.college_requests add column reviewed_at timestamptz;
alter table public.college_requests add column decision_reason text;

create function public.is_platform_admin() returns boolean language sql stable security definer set search_path=public,pg_temp as $$ select exists(select 1 from public.platform_admins where user_id=auth.uid() and revoked_at is null); $$;
revoke all on function public.is_platform_admin() from public,anon;grant execute on function public.is_platform_admin() to authenticated;

create function public.register_society(p_college uuid,p_name text,p_slug text,p_description text,p_evidence text) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_society uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 if length(trim(p_name)) not between 3 and 100 or p_slug !~ '^[a-z0-9][a-z0-9-]{2,79}$' or length(p_description)>2000 or length(p_evidence)>500 or p_evidence !~ '^https://[^[:space:]<>]+$' then raise exception 'Enter valid society details and a public evidence URL';end if;
 if not exists(select 1 from public.colleges where id=p_college and status='approved') then raise exception 'Choose an approved college';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||'society-application',0));
 if (select count(*) from public.society_applications where applicant_id=auth.uid() and created_at>now()-interval '1 day')>=3 then raise exception 'Application limit reached; retry tomorrow';end if;
 insert into public.societies(college_id,name,slug,description,created_by) values(p_college,trim(p_name),p_slug,trim(p_description),auth.uid()) returning id into v_society;
 insert into public.society_applications(society_id,applicant_id,evidence_path) values(v_society,auth.uid(),p_evidence);
 return v_society;
end; $$;
create function public.community_review_queue() returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
 if not public.is_platform_admin() then raise exception 'Not authorized';end if;
 return jsonb_build_object('societies',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'name',s.name,'slug',s.slug,'description',s.description,'college',c.name,'evidence',a.evidence_path,'createdAt',a.created_at) order by a.created_at) from public.society_applications a join public.societies s on s.id=a.society_id join public.colleges c on c.id=s.college_id where a.status='pending'),'[]'::jsonb),
 'colleges',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'city',city,'state',state,'createdAt',created_at) order by created_at) from public.college_requests where status='pending'),'[]'::jsonb));
end; $$;
create function public.review_community_request(p_kind text,p_id uuid,p_approve boolean,p_reason text default '',p_college uuid default null) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.society_applications; r public.college_requests; v_college uuid; v_normalized text;
begin
 if not public.is_platform_admin() then raise exception 'Not authorized';end if;
 if length(p_reason)>500 then raise exception 'Keep the review reason under 500 characters';end if;
 if p_kind='society' then
  select * into a from public.society_applications where id=p_id and status='pending' for update;if not found then raise exception 'Request already reviewed or unavailable';end if;
  perform pg_advisory_xact_lock(hashtextextended(a.applicant_id::text||'membership',0));
  update public.society_applications set status=case when p_approve then 'approved' else 'rejected' end,decided_by=auth.uid(),decided_at=now(),decision_reason=p_reason where id=p_id;
  update public.societies set status=case when p_approve then 'approved' else 'rejected' end,approved_by=case when p_approve then auth.uid() else null end,approved_at=case when p_approve then now() else null end where id=a.society_id;
  if p_approve then insert into public.memberships(user_id,society_id,role,status,competitive,reviewed_by) values(a.applicant_id,a.society_id,'admin','active',not exists(select 1 from public.memberships where user_id=a.applicant_id and status='active' and competitive and effective_to is null),auth.uid());end if;
 elsif p_kind='college' then
  select * into r from public.college_requests where id=p_id and status='pending' for update;if not found then raise exception 'Request already reviewed or unavailable';end if;
  if p_approve then
   if p_college is not null then select id into v_college from public.colleges where id=p_college and status='approved';if not found then raise exception 'Choose an approved canonical institution';end if;
   else
    v_normalized:=trim(regexp_replace(lower(r.name||' '||coalesce(r.city,'')||' '||coalesce(r.state,'')),'[^a-z0-9]+',' ','g'));
    if length(v_normalized)<3 then raise exception 'A canonical English institution name is required';end if;
    insert into public.colleges(slug,name,normalized_name,city,state,status,source,source_ref,source_updated_at) values('reviewed-'||r.id::text,r.name,v_normalized,r.city,r.state,'approved','manual-review',r.id::text,now()) on conflict(normalized_name) do nothing returning id into v_college;
    if v_college is null then select id into v_college from public.colleges where normalized_name=v_normalized and status='approved';end if;
    if v_college is null then raise exception 'An unresolved duplicate institution exists; select its canonical record';end if;
   end if;
   insert into public.college_aliases(college_id,normalized_alias) values(v_college,regexp_replace(lower(r.name),'[^a-z0-9]','','g')) on conflict(normalized_alias) do nothing;
   update public.profiles set college_id=v_college where id=r.user_id and college_id is null;
  end if;
  update public.college_requests set status=case when p_approve then 'approved' else 'rejected' end,college_id=v_college,reviewed_by=auth.uid(),reviewed_at=now(),decision_reason=p_reason where id=p_id;
 else raise exception 'Choose a supported review type';end if;
 insert into public.audit_logs(actor_id,action,object_type,object_id,metadata) values(auth.uid(),case when p_approve then 'approved' else 'rejected' end,p_kind,p_id,jsonb_build_object('reason',p_reason));
end; $$;
revoke all on function public.register_society(uuid,text,text,text,text),public.community_review_queue(),public.review_community_request(text,uuid,boolean,text,uuid) from public,anon;
grant execute on function public.register_society(uuid,text,text,text,text),public.community_review_queue(),public.review_community_request(text,uuid,boolean,text,uuid) to authenticated;

create or replace function public.apply_to_society(p_society_id uuid) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 if not exists(select 1 from public.societies where id=p_society_id and status='approved') then raise exception 'Society is unavailable';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||'membership',0));
 if exists(select 1 from public.memberships where user_id=auth.uid() and society_id=p_society_id and status='active') then raise exception 'You are already an active member';end if;
 select id into v_id from public.memberships where user_id=auth.uid() and society_id=p_society_id and status='pending';if found then return v_id;end if;
 if (select count(*) from public.memberships where user_id=auth.uid() and status='pending')>=3 then raise exception 'Finish your pending membership requests first';end if;
 insert into public.memberships(user_id,society_id) values(auth.uid(),p_society_id) returning id into v_id;return v_id;
end; $$;
create or replace function public.review_society_membership(p_membership_id uuid,p_decision text) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare m public.memberships;
begin
 if auth.uid() is null or p_decision not in ('active','rejected') then raise exception 'Invalid membership decision';end if;
 select * into m from public.memberships where id=p_membership_id and status='pending' for update;if not found then return false;end if;
 if not public.is_platform_admin() and not exists(select 1 from public.memberships where user_id=auth.uid() and society_id=m.society_id and status='active' and role in ('admin','moderator')) then raise exception 'Not authorized to manage this society';end if;
 perform pg_advisory_xact_lock(hashtextextended(m.user_id::text||'membership',0));
 if p_decision='active' and exists(select 1 from public.memberships where user_id=m.user_id and status='active' and competitive and effective_to is null) then raise exception 'This member already has an active competitive society';end if;
 update public.memberships set status=p_decision,reviewed_by=auth.uid(),effective_from=case when p_decision='active' then now() else effective_from end where id=p_membership_id;
 insert into public.audit_logs(actor_id,action,object_type,object_id) values(auth.uid(),'membership.'||p_decision,'membership',p_membership_id);return true;
end; $$;
create function public.public_society_summary(p_societies uuid[]) returns table(id uuid,members bigint,eligible_members bigint,average_cf_rating numeric) language sql stable security definer set search_path=public,pg_temp as $$
 select s.id,count(distinct m.user_id),count(distinct m.user_id) filter(where p.is_public and cp.user_id is not null and ps.history_complete and ps.last_synced_at>now()-interval '7 days'),
 round(avg((ps.summary->>'rating')::numeric) filter(where p.is_public and cp.user_id is not null and jsonb_typeof(ps.summary->'rating')='number' and ps.last_synced_at>now()-interval '7 days'),0)
 from public.societies s left join public.memberships m on m.society_id=s.id and m.status='active' and m.effective_to is null
 left join public.profiles p on p.id=m.user_id left join public.coding_profiles cp on cp.user_id=p.id and cp.platform='codeforces' left join public.provider_snapshots ps on ps.user_id=cp.user_id and ps.provider='codeforces'
 where s.id=any(p_societies) and array_length(p_societies,1)<=100 and s.status='approved' group by s.id;
$$;
revoke all on function public.public_society_summary(uuid[]) from public;
grant execute on function public.public_society_summary(uuid[]) to anon,authenticated;

create function public.public_society_members(p_society uuid,p_offset integer default 0) returns table(username text,display_name text,role text,joined_at timestamptz) language sql stable security definer set search_path=public,pg_temp as $$
 select p.username,coalesce(p.display_name,p.username),m.role,m.effective_from from public.memberships m join public.profiles p on p.id=m.user_id and p.is_public and p.username is not null join public.societies s on s.id=m.society_id and s.status='approved'
 where m.society_id=p_society and m.status='active' and m.effective_to is null and p_offset between 0 and 100000 order by m.effective_from,p.username limit 50 offset greatest(0,p_offset);
$$;
revoke all on function public.public_society_members(uuid,integer) from public;
grant execute on function public.public_society_members(uuid,integer) to anon,authenticated;
