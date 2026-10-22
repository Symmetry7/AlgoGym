-- Soft-remove a current member while preserving their history and contest records.
create function public.remove_society_member(p_membership uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v_target public.memberships; v_actor public.memberships; v_slug text;
begin
  select * into v_target from public.memberships
    where id=p_membership and status='active' and effective_to is null for update;
  if not found then raise exception 'Active member not found'; end if;
  if not public.society_can(v_target.society_id,'manage_members') then raise exception 'Not authorized'; end if;
  select * into v_actor from public.memberships
    where society_id=v_target.society_id and user_id=auth.uid() and status='active' and effective_to is null
    order by created_at desc limit 1;
  if v_target.user_id=auth.uid() or v_target.role='admin' or
    (v_actor.role='moderator' and v_target.role<>'member') then
    raise exception 'This member cannot be removed by your role';
  end if;
  update public.memberships set status='left',competitive=false,effective_to=now()
    where id=p_membership;
  select slug into v_slug from public.societies where id=v_target.society_id;
  insert into public.society_notifications(society_id,recipient_id,event_key,kind,title,body,href)
    values(v_target.society_id,v_target.user_id,'member-removed:'||p_membership::text,
      'membership_removed','Society membership ended',
      'A society manager ended your membership. Your previous activity remains in your account.',
      '/societies/'||v_slug)
    on conflict(recipient_id,event_key) do nothing;
  insert into public.audit_logs(actor_id,action,object_type,object_id,metadata)
    values(auth.uid(),'society.member.remove','membership',p_membership,
      jsonb_build_object('society_id',v_target.society_id,'member_id',v_target.user_id));
end; $$;
revoke all on function public.remove_society_member(uuid) from public,anon;
grant execute on function public.remove_society_member(uuid) to authenticated;
