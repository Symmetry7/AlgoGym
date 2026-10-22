-- Registration and moderator changes produce persistent in-app notifications;
-- the email outbox trigger delivers them asynchronously when configured.
create or replace function public.register_society_contest(p_contest uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.society_contests;v_handle text;v_registration uuid;v_slug text;
begin
  select * into c from public.society_contests where id=p_contest;
  if not found or c.state<>'published' or now()>c.registration_deadline or now()>c.ends_at then raise exception 'Registration is closed'; end if;
  if not public.society_can(c.society_id,'view') then raise exception 'Active membership required'; end if;
  select username into v_handle from public.coding_profiles where user_id=auth.uid() and platform='codeforces' and verified_at is not null;
  if v_handle is null then raise exception 'Connect a verified Codeforces handle before registering'; end if;
  insert into public.society_contest_registrations(contest_id,user_id,cf_handle)
    values(p_contest,auth.uid(),v_handle) on conflict do nothing returning id into v_registration;
  if v_registration is not null then
    select slug into v_slug from public.societies where id=c.society_id;
    insert into public.society_notifications(society_id,recipient_id,event_key,kind,title,body,href)
      values(c.society_id,auth.uid(),'contest-registration:'||v_registration::text,'contest_registration',
        'Registered for '||c.title,'Your verified Codeforces handle is set for this contest.',
        '/societies/'||v_slug||'/contests/'||p_contest::text)
      on conflict(recipient_id,event_key) do nothing;
  end if;
end; $$;

create function public.notify_society_role_change() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_slug text;
begin
  if old.role is not distinct from new.role or new.status<>'active' then return new; end if;
  select slug into v_slug from public.societies where id=new.society_id;
  insert into public.society_notifications(society_id,recipient_id,event_key,kind,title,body,href)
    values(new.society_id,new.user_id,'role:'||new.id::text||':'||txid_current()::text,'moderator_role',
      case when new.role='moderator' then 'You are now a society moderator' else 'Your society role changed' end,
      'Open the society workspace to review your current permissions.','/societies/'||v_slug)
    on conflict(recipient_id,event_key) do nothing;
  return new;
end; $$;
create trigger notify_society_role_change after update of role on public.memberships
  for each row execute function public.notify_society_role_change();
revoke all on function public.notify_society_role_change() from public,anon,authenticated;
