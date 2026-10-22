-- Additive society workspace foundation. Existing societies remain open;
-- newly created societies require approval unless their owner changes policy.
alter table public.societies add column if not exists join_policy text not null default 'open'
  check (join_policy in ('open','approval','invite'));
alter table public.societies alter column join_policy set default 'approval';
alter table public.societies add column if not exists logo_url text;

create table if not exists public.society_moderator_permissions (
  membership_id uuid primary key references public.memberships(id) on delete cascade,
  review_requests boolean not null default false,
  manage_members boolean not null default false,
  view_activity boolean not null default false,
  manage_contests boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
create table if not exists public.society_notifications (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null,
  kind text not null,
  title text not null,
  body text,
  href text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (recipient_id,event_key),
  check (length(title) between 1 and 180),
  check (href like '/%')
);
create index if not exists society_notifications_inbox on public.society_notifications(recipient_id,created_at desc);

create table if not exists public.society_announcements (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  title text not null check (length(title) between 3 and 180),
  body text not null check (length(body) between 1 and 20000),
  author_id uuid not null references auth.users(id) on delete restrict,
  pinned boolean not null default false,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists society_announcements_feed on public.society_announcements(society_id,pinned desc,published_at desc);
create table if not exists public.society_announcement_revisions (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.society_announcements(id) on delete cascade,
  editor_id uuid references auth.users(id) on delete set null,
  old_title text not null,
  old_body text not null,
  changed_at timestamptz not null default now()
);

create table if not exists public.society_activity_policies (
  society_id uuid primary key references public.societies(id) on delete cascade,
  minimum_weekly_solves integer not null default 3 check (minimum_weekly_solves between 0 and 1000),
  maximum_inactive_days integer not null default 14 check (maximum_inactive_days between 1 and 365),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
create table if not exists public.society_warnings (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  admin_id uuid not null references auth.users(id) on delete restrict,
  reason text not null check (reason in ('low_activity','no_recent_activity','missed_contests','custom')),
  message text not null check (length(message) between 20 and 1000),
  acknowledged_at timestamptz,
  explanation text check (explanation is null or length(explanation) <= 2000),
  created_at timestamptz not null default now()
);
create index if not exists society_warnings_member on public.society_warnings(member_id,created_at desc);
create index if not exists society_warnings_admin on public.society_warnings(society_id,created_at desc);

alter table public.society_moderator_permissions enable row level security;
alter table public.society_notifications enable row level security;
alter table public.society_announcements enable row level security;
alter table public.society_announcement_revisions enable row level security;
alter table public.society_activity_policies enable row level security;
alter table public.society_warnings enable row level security;
revoke all on public.society_moderator_permissions,public.society_notifications,
  public.society_announcements,public.society_announcement_revisions,
  public.society_activity_policies,public.society_warnings from public,anon,authenticated;
grant all on public.society_moderator_permissions,public.society_notifications,
  public.society_announcements,public.society_announcement_revisions,
  public.society_activity_policies,public.society_warnings to service_role;
create policy own_society_notifications on public.society_notifications for select to authenticated using (recipient_id=auth.uid());
create policy read_society_announcements on public.society_announcements for select to authenticated using (
  exists(select 1 from public.memberships m where m.society_id=society_id and m.user_id=auth.uid() and m.status='active' and m.effective_to is null)
);
create policy own_society_warnings on public.society_warnings for select to authenticated using (member_id=auth.uid());
grant select on public.society_notifications,public.society_announcements,public.society_warnings to authenticated;

create or replace function public.society_can(p_society uuid,p_action text)
returns boolean language plpgsql stable security definer set search_path=public,pg_temp as $$
declare m public.memberships;
begin
  select * into m from public.memberships where society_id=p_society and user_id=auth.uid() and status='active' and effective_to is null order by created_at desc limit 1;
  if not found then return false; end if;
  if p_action='view' then return true; end if;
  if m.role='admin' then return true; end if;
  if m.role<>'moderator' then return false; end if;
  if p_action='announce' then return true; end if;
  return coalesce((select case p_action
    when 'review_requests' then review_requests
    when 'manage_members' then manage_members
    when 'view_activity' then view_activity
    when 'manage_contests' then manage_contests
    else false end from public.society_moderator_permissions where membership_id=m.id),false);
end; $$;
revoke all on function public.society_can(uuid,text) from public,anon;
grant execute on function public.society_can(uuid,text) to authenticated;

create or replace function public.get_society_invite(p_society uuid)
returns text language plpgsql security definer set search_path=public,pg_temp as $$
declare v_token text;
begin
  if not public.society_can(p_society,'manage_members') then raise exception 'Not authorized to invite members'; end if;
  if not exists(select 1 from public.societies where id=p_society and status='approved') then raise exception 'Society unavailable'; end if;
  insert into public.society_invites(society_id) values(p_society) on conflict do nothing;
  select token into v_token from public.society_invites where society_id=p_society;
  return v_token;
end; $$;
revoke all on function public.get_society_invite(uuid) from public,anon;
grant execute on function public.get_society_invite(uuid) to authenticated;

create or replace function public.apply_to_society(p_society_id uuid)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_user uuid:=auth.uid(); v_id uuid; v_policy text; v_competitive boolean; v_slug text;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select join_policy,slug into v_policy,v_slug from public.societies where id=p_society_id and status='approved';
  if not found then raise exception 'Society unavailable'; end if;
  if v_policy='invite' then raise exception 'This society requires an invitation'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text||'membership',0));
  if exists(select 1 from public.memberships where user_id=v_user and society_id=p_society_id and status='suspended') then raise exception 'Your membership is suspended'; end if;
  select id into v_id from public.memberships where user_id=v_user and society_id=p_society_id and status in ('active','pending') and effective_to is null order by created_at desc limit 1;
  if found then return v_id; end if;
  if exists(select 1 from public.memberships where user_id=v_user and society_id=p_society_id and status='rejected' and created_at>now()-interval '7 days') then raise exception 'Please wait before requesting again'; end if;
  if (select count(*) from public.memberships where user_id=v_user and created_at>now()-interval '1 hour')>=20 then raise exception 'Please wait before joining more societies'; end if;
  v_competitive:=not exists(select 1 from public.memberships where user_id=v_user and status='active' and competitive and effective_to is null);
  insert into public.memberships(user_id,society_id,status,role,competitive,effective_from)
    values(v_user,p_society_id,case when v_policy='open' then 'active' else 'pending' end,'member',case when v_policy='open' then v_competitive else false end,now()) returning id into v_id;
  if v_policy='approval' then
    insert into public.society_notifications(society_id,recipient_id,event_key,kind,title,body,href)
    select p_society_id,m.user_id,'join:'||v_id::text||':'||m.user_id::text,'join_request','New membership request',
      coalesce(p.display_name,p.username,'A student')||' requested to join.', '/societies/'||v_slug||'/manage?request='||v_id::text
    from public.memberships m left join public.profiles p on p.id=v_user
    where m.society_id=p_society_id and m.status='active' and m.role='admin' and m.effective_to is null
    on conflict (recipient_id,event_key) do nothing;
  end if;
  return v_id;
end; $$;
revoke all on function public.apply_to_society(uuid) from public,anon;
grant execute on function public.apply_to_society(uuid) to authenticated;

create or replace function public.join_society_invite(p_token text)
returns text language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.societies; v_id uuid; v_competitive boolean;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select so.* into s from public.societies so join public.society_invites i on i.society_id=so.id
    where i.token=p_token and length(p_token)=64 and so.status='approved';
  if not found then raise exception 'This invitation is unavailable'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||'membership',0));
  if exists(select 1 from public.memberships where society_id=s.id and user_id=auth.uid() and status='suspended') then raise exception 'Membership suspended'; end if;
  v_competitive:=not exists(select 1 from public.memberships where user_id=auth.uid() and status='active' and competitive and effective_to is null);
  select id into v_id from public.memberships where society_id=s.id and user_id=auth.uid() and status in ('pending','active') and effective_to is null order by created_at desc limit 1;
  if v_id is null then
    insert into public.memberships(user_id,society_id,status,role,competitive,effective_from)
      values(auth.uid(),s.id,'active','member',v_competitive,now());
  else
    update public.memberships set status='active',competitive=case when status='active' then competitive else v_competitive end,effective_from=now() where id=v_id and status='pending';
  end if;
  return s.slug;
end; $$;
revoke all on function public.join_society_invite(text) from public,anon;
grant execute on function public.join_society_invite(text) to authenticated;

create or replace function public.list_society_membership_requests(p_slug text)
returns table (id uuid, applicant_name text, requested_at timestamptz)
language plpgsql stable security definer set search_path=public,pg_temp as $$
declare v_society uuid;
begin
  select s.id into v_society from public.societies s where s.slug=p_slug and s.status='approved';
  if v_society is null or not public.society_can(v_society,'review_requests') then raise exception 'Not authorized'; end if;
  return query select m.id,coalesce(nullif(p.display_name,''),p.username,'AlgoGym member'),m.created_at
    from public.memberships m left join public.profiles p on p.id=m.user_id
    where m.society_id=v_society and m.status='pending' order by m.created_at;
end; $$;

create or replace function public.review_society_membership(p_membership_id uuid,p_decision text)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare m public.memberships; v_competitive boolean; v_slug text;
begin
  if p_decision not in ('active','rejected') then raise exception 'Invalid membership decision'; end if;
  select * into m from public.memberships where id=p_membership_id and status='pending' for update;
  if not found then return false; end if;
  if not public.society_can(m.society_id,'review_requests') then raise exception 'Not authorized'; end if;
  perform pg_advisory_xact_lock(hashtextextended(m.user_id::text||'membership',0));
  v_competitive:=not exists(select 1 from public.memberships where user_id=m.user_id and status='active' and competitive and effective_to is null);
  update public.memberships set status=p_decision,reviewed_by=auth.uid(),competitive=case when p_decision='active' then v_competitive else false end,
    effective_from=case when p_decision='active' then now() else effective_from end where id=p_membership_id;
  select slug into v_slug from public.societies where id=m.society_id;
  insert into public.society_notifications(society_id,recipient_id,event_key,kind,title,body,href)
    values(m.society_id,m.user_id,'join-decision:'||m.id::text,'membership_decision',
      case when p_decision='active' then 'Membership approved' else 'Membership request declined' end,
      case when p_decision='active' then 'You can now open the society workspace.' else 'You can request again after seven days.' end,
      '/societies/'||v_slug)
    on conflict (recipient_id,event_key) do nothing;
  insert into public.audit_logs(actor_id,action,object_type,object_id,metadata)
    values(auth.uid(),'society.membership.review','membership',m.id,jsonb_build_object('society_id',m.society_id,'decision',p_decision));
  return true;
end; $$;
revoke all on function public.review_society_membership(uuid,text) from public,anon;
grant execute on function public.review_society_membership(uuid,text) to authenticated;

create function public.set_society_moderator(p_membership uuid,p_promote boolean,p_review_requests boolean default false,p_manage_members boolean default false,p_view_activity boolean default false,p_manage_contests boolean default false)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare m public.memberships; v_owner uuid;
begin
  select * into m from public.memberships where id=p_membership and status='active' and effective_to is null for update;
  if not found then raise exception 'Active member not found'; end if;
  if not public.society_can(m.society_id,'admin') then raise exception 'Not authorized'; end if;
  select created_by into v_owner from public.societies where id=m.society_id;
  if m.user_id=v_owner or m.role='admin' then raise exception 'Owner and admins cannot be changed here'; end if;
  update public.memberships set role=case when p_promote then 'moderator' else 'member' end where id=p_membership;
  if p_promote then
    insert into public.society_moderator_permissions(membership_id,review_requests,manage_members,view_activity,manage_contests,updated_by)
      values(p_membership,p_review_requests,p_manage_members,p_view_activity,p_manage_contests,auth.uid())
      on conflict(membership_id) do update set review_requests=excluded.review_requests,manage_members=excluded.manage_members,
        view_activity=excluded.view_activity,manage_contests=excluded.manage_contests,updated_by=auth.uid(),updated_at=now();
  else delete from public.society_moderator_permissions where membership_id=p_membership; end if;
  insert into public.audit_logs(actor_id,action,object_type,object_id,metadata)
    values(auth.uid(),'society.moderator.change','membership',p_membership,jsonb_build_object('society_id',m.society_id,'promote',p_promote));
end; $$;
revoke all on function public.set_society_moderator(uuid,boolean,boolean,boolean,boolean,boolean) from public,anon;
grant execute on function public.set_society_moderator(uuid,boolean,boolean,boolean,boolean,boolean) to authenticated;

create function public.set_society_policy(p_society uuid,p_join_policy text,p_weekly_solves integer,p_inactive_days integer)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if not public.society_can(p_society,'admin') then raise exception 'Not authorized'; end if;
  if p_join_policy not in ('open','approval','invite') or p_weekly_solves not between 0 and 1000 or p_inactive_days not between 1 and 365 then raise exception 'Invalid society policy'; end if;
  update public.societies set join_policy=p_join_policy where id=p_society;
  insert into public.society_activity_policies(society_id,minimum_weekly_solves,maximum_inactive_days,updated_by)
    values(p_society,p_weekly_solves,p_inactive_days,auth.uid())
    on conflict(society_id) do update set minimum_weekly_solves=excluded.minimum_weekly_solves,maximum_inactive_days=excluded.maximum_inactive_days,updated_by=auth.uid(),updated_at=now();
  insert into public.audit_logs(actor_id,action,object_type,object_id,metadata)
    values(auth.uid(),'society.policy.change','society',p_society,jsonb_build_object('join_policy',p_join_policy,'weekly_solves',p_weekly_solves,'inactive_days',p_inactive_days));
end; $$;
revoke all on function public.set_society_policy(uuid,text,integer,integer) from public,anon;
grant execute on function public.set_society_policy(uuid,text,integer,integer) to authenticated;

create function public.publish_society_announcement(p_society uuid,p_title text,p_body text,p_pinned boolean default false)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid; v_slug text;
begin
  if not public.society_can(p_society,'announce') then raise exception 'Not authorized'; end if;
  if length(trim(p_title)) not between 3 and 180 or length(trim(p_body)) not between 1 and 20000 then raise exception 'Invalid announcement'; end if;
  insert into public.society_announcements(society_id,title,body,author_id,pinned) values(p_society,trim(p_title),trim(p_body),auth.uid(),p_pinned) returning id into v_id;
  select slug into v_slug from public.societies where id=p_society;
  insert into public.society_notifications(society_id,recipient_id,event_key,kind,title,body,href)
    select p_society,m.user_id,'announcement:'||v_id::text,'announcement',trim(p_title),left(trim(p_body),180),'/societies/'||v_slug||'?tab=announcements'
    from public.memberships m where m.society_id=p_society and m.status='active' and m.effective_to is null and m.user_id<>auth.uid()
    on conflict (recipient_id,event_key) do nothing;
  insert into public.audit_logs(actor_id,action,object_type,object_id,metadata) values(auth.uid(),'society.announcement.publish','announcement',v_id,jsonb_build_object('society_id',p_society));
  return v_id;
end; $$;
revoke all on function public.publish_society_announcement(uuid,text,text,boolean) from public,anon;
grant execute on function public.publish_society_announcement(uuid,text,text,boolean) to authenticated;

create function public.send_society_warning(p_society uuid,p_member uuid,p_reason text,p_message text)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid; v_slug text;
begin
  if not public.society_can(p_society,'admin') then raise exception 'Not authorized'; end if;
  if p_member=auth.uid() or not exists(select 1 from public.memberships where society_id=p_society and user_id=p_member and status='active' and effective_to is null) then raise exception 'Choose an active member'; end if;
  if p_reason not in ('low_activity','no_recent_activity','missed_contests','custom') or length(trim(p_message)) not between 20 and 1000 then raise exception 'Invalid warning'; end if;
  if exists(select 1 from public.society_warnings where society_id=p_society and member_id=p_member and created_at>now()-interval '7 days') then raise exception 'Wait seven days before sending another warning'; end if;
  insert into public.society_warnings(society_id,member_id,admin_id,reason,message) values(p_society,p_member,auth.uid(),p_reason,trim(p_message)) returning id into v_id;
  select slug into v_slug from public.societies where id=p_society;
  insert into public.society_notifications(society_id,recipient_id,event_key,kind,title,body,href)
    values(p_society,p_member,'warning:'||v_id::text,'warning','Private practice note','An administrator sent you a private practice note.','/societies/'||v_slug||'?tab=notifications');
  insert into public.audit_logs(actor_id,action,object_type,object_id,metadata) values(auth.uid(),'society.warning.send','warning',v_id,jsonb_build_object('society_id',p_society,'member_id',p_member));
  return v_id;
end; $$;
revoke all on function public.send_society_warning(uuid,uuid,text,text) from public,anon;
grant execute on function public.send_society_warning(uuid,uuid,text,text) to authenticated;

create function public.acknowledge_society_warning(p_warning uuid,p_explanation text default '')
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if length(p_explanation)>2000 then raise exception 'Explanation is too long'; end if;
  update public.society_warnings set acknowledged_at=coalesce(acknowledged_at,now()),explanation=nullif(trim(p_explanation),'')
    where id=p_warning and member_id=auth.uid();
  if not found then raise exception 'Warning unavailable'; end if;
end; $$;
revoke all on function public.acknowledge_society_warning(uuid,text) from public,anon;
grant execute on function public.acknowledge_society_warning(uuid,text) to authenticated;

create function public.read_society_workspace(p_society uuid)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare v_result jsonb;
begin
  if not public.society_can(p_society,'view') then raise exception 'Active membership required'; end if;
  select jsonb_build_object(
    'members',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'userId',m.user_id,'name',coalesce(p.display_name,p.username,'Member'),'username',p.username,'avatarUrl',p.avatar_url,'role',m.role,'joinedAt',m.effective_from,'solves7',(select count(*) from public.solves sl where sl.user_id=m.user_id and sl.proof_status='verified' and sl.first_accepted_at>=now()-interval '7 days'),'solves30',(select count(*) from public.solves sl where sl.user_id=m.user_id and sl.proof_status='verified' and sl.first_accepted_at>=now()-interval '30 days'),'lastVerifiedAt',(select max(sl.first_accepted_at) from public.solves sl where sl.user_id=m.user_id and sl.proof_status='verified')) order by p.display_name)
      from public.memberships m join public.profiles p on p.id=m.user_id where m.society_id=p_society and m.status='active' and m.effective_to is null),'[]'::jsonb),
    'announcements',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'title',a.title,'body',a.body,'pinned',a.pinned,'publishedAt',a.published_at,'author',coalesce(p.display_name,p.username,'Member'),'username',p.username) order by a.pinned desc,a.published_at desc)
      from public.society_announcements a join public.profiles p on p.id=a.author_id where a.society_id=p_society and a.published_at<=now()),'[]'::jsonb),
    'policy',(select jsonb_build_object('minimumWeeklySolves',minimum_weekly_solves,'maximumInactiveDays',maximum_inactive_days) from public.society_activity_policies where society_id=p_society),
    'permissions',(select jsonb_build_object('role',m.role,'reviewRequests',public.society_can(p_society,'review_requests'),'manageMembers',public.society_can(p_society,'manage_members'),'viewActivity',public.society_can(p_society,'view_activity'),'manageContests',public.society_can(p_society,'manage_contests'),'announce',public.society_can(p_society,'announce')) from public.memberships m where m.society_id=p_society and m.user_id=auth.uid() and m.status='active' and m.effective_to is null order by m.created_at desc limit 1)
  ) into v_result;
  return v_result;
end; $$;
revoke all on function public.read_society_workspace(uuid) from public,anon;
grant execute on function public.read_society_workspace(uuid) to authenticated;

create function public.read_society_admin(p_society uuid)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare v_result jsonb;
begin
  if not public.society_can(p_society,'admin') and not public.society_can(p_society,'review_requests')
    and not public.society_can(p_society,'view_activity') then raise exception 'Not authorized'; end if;
  select jsonb_build_object(
    'requests',case when public.society_can(p_society,'review_requests') then
      coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'name',coalesce(p.display_name,p.username,'Member'),'username',p.username,'avatarUrl',p.avatar_url,'college',c.name,'status',m.status,'requestedAt',m.created_at,'handles',(select coalesce(jsonb_agg(jsonb_build_object('platform',cp.platform,'username',cp.username)),'[]'::jsonb) from public.coding_profiles cp where cp.user_id=m.user_id)) order by m.created_at desc)
        from public.memberships m join public.profiles p on p.id=m.user_id left join public.colleges c on c.id=p.college_id
        where m.society_id=p_society and m.status in ('pending','rejected') and m.created_at>now()-interval '1 year'),'[]'::jsonb)
      else '[]'::jsonb end,
    'moderators',case when public.society_can(p_society,'admin') then
      coalesce((select jsonb_agg(jsonb_build_object('membershipId',m.id,'name',coalesce(p.display_name,p.username,'Member'),'reviewRequests',coalesce(mp.review_requests,false),'manageMembers',coalesce(mp.manage_members,false),'viewActivity',coalesce(mp.view_activity,false),'manageContests',coalesce(mp.manage_contests,false)) order by p.display_name)
        from public.memberships m join public.profiles p on p.id=m.user_id left join public.society_moderator_permissions mp on mp.membership_id=m.id
        where m.society_id=p_society and m.status='active' and m.role='moderator'),'[]'::jsonb)
      else '[]'::jsonb end,
    'warnings',case when public.society_can(p_society,'admin') then
      coalesce((select jsonb_agg(jsonb_build_object('id',w.id,'memberId',w.member_id,'name',coalesce(p.display_name,p.username,'Member'),'reason',w.reason,'message',w.message,'createdAt',w.created_at,'acknowledgedAt',w.acknowledged_at,'explanation',w.explanation) order by w.created_at desc)
        from public.society_warnings w join public.profiles p on p.id=w.member_id where w.society_id=p_society),'[]'::jsonb)
      else '[]'::jsonb end,
    'audit',case when public.society_can(p_society,'admin') then
      coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'action',a.action,'createdAt',a.created_at,'metadata',a.metadata) order by a.created_at desc)
        from public.audit_logs a where a.metadata->>'society_id'=p_society::text and a.action like 'society.%' and a.created_at>now()-interval '1 year'),'[]'::jsonb)
      else '[]'::jsonb end
  ) into v_result;
  return v_result;
end; $$;
revoke all on function public.read_society_admin(uuid) from public,anon;
grant execute on function public.read_society_admin(uuid) to authenticated;

create function public.mark_society_notifications_read(p_ids uuid[] default null)
returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare v_count integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_ids is not null and cardinality(p_ids)>100 then raise exception 'Too many notifications'; end if;
  update public.society_notifications set read_at=now() where recipient_id=auth.uid() and read_at is null and (p_ids is null or id=any(p_ids));
  get diagnostics v_count=row_count; return v_count;
end; $$;
revoke all on function public.mark_society_notifications_read(uuid[]) from public,anon;
grant execute on function public.mark_society_notifications_read(uuid[]) to authenticated;

create function public.set_leaderboard_college(p_college uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v_profile_college uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_college is not null and not exists(select 1 from public.colleges where id=p_college and status='approved') then raise exception 'Choose an approved college'; end if;
  select college_id into v_profile_college from public.profiles where id=auth.uid();
  update public.profiles set preferences=case when p_college is null then preferences-'leaderboard_college_id'-'leaderboard_source_college_id'
    else jsonb_set(jsonb_set(preferences,'{leaderboard_college_id}',to_jsonb(p_college::text)),'{leaderboard_source_college_id}',to_jsonb(coalesce(v_profile_college::text,''))) end,
    updated_at=now() where id=auth.uid();
end; $$;
revoke all on function public.set_leaderboard_college(uuid) from public,anon;
grant execute on function public.set_leaderboard_college(uuid) to authenticated;
