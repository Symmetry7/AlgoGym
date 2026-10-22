-- Only an active admin of the owning society can permanently remove its content.
-- Keep a minimal audit record after the content and dependent records are deleted.
create function public.delete_society_announcement(p_society uuid, p_announcement uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v_announcement public.society_announcements;
begin
  if not public.society_can(p_society, 'admin') then raise exception 'Not authorized'; end if;
  select * into v_announcement from public.society_announcements
    where id=p_announcement and society_id=p_society for update;
  if not found then raise exception 'Announcement not found'; end if;

  -- Remove stale inbox entries and unsent email outbox rows along with the post.
  delete from public.society_notifications
    where society_id=p_society and event_key='announcement:'||p_announcement::text;
  delete from public.society_announcements where id=p_announcement;
  insert into public.audit_logs(actor_id,action,object_type,object_id,metadata)
    values(auth.uid(),'society.announcement.delete','announcement',p_announcement,
      jsonb_build_object('society_id',p_society,'title',v_announcement.title));
end; $$;
revoke all on function public.delete_society_announcement(uuid,uuid) from public,anon;
grant execute on function public.delete_society_announcement(uuid,uuid) to authenticated;

create function public.delete_society_contest(p_contest uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v_contest public.society_contests;
begin
  select * into v_contest from public.society_contests where id=p_contest for update;
  if not found then raise exception 'Contest not found'; end if;
  if not public.society_can(v_contest.society_id, 'admin') then raise exception 'Not authorized'; end if;

  -- The contest's problems, registrations, submissions, editors and final
  -- standings have ON DELETE CASCADE foreign keys.
  delete from public.society_notifications
    where society_id=v_contest.society_id
      and href like '%/contests/'||p_contest::text;
  delete from public.society_contests where id=p_contest;
  insert into public.audit_logs(actor_id,action,object_type,object_id,metadata)
    values(auth.uid(),'society.contest.delete','contest',p_contest,
      jsonb_build_object('society_id',v_contest.society_id,'title',v_contest.title,'state',v_contest.state));
end; $$;
revoke all on function public.delete_society_contest(uuid) from public,anon;
grant execute on function public.delete_society_contest(uuid) to authenticated;
