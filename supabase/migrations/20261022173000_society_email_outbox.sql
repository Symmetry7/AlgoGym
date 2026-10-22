-- In-app notifications remain the source of truth. Email is asynchronous and
-- cannot roll back a successful society mutation.
create table public.society_email_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  society_updates boolean not null default true,
  contest_updates boolean not null default true,
  updated_at timestamptz not null default now()
);
create table public.society_email_outbox (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null unique references public.society_notifications(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  recipient_email text not null,
  subject text not null,
  body text not null default '',
  href text not null,
  status text not null default 'pending' check(status in ('pending','sending','sent','failed')),
  attempts integer not null default 0 check(attempts>=0),
  next_attempt_at timestamptz not null default now(),
  locked_until timestamptz,
  provider_id text,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index society_email_outbox_due on public.society_email_outbox(next_attempt_at) where status in ('pending','sending');
alter table public.society_email_preferences enable row level security;
alter table public.society_email_outbox enable row level security;
revoke all on public.society_email_preferences,public.society_email_outbox from public,anon,authenticated;
grant select,insert,update on public.society_email_preferences to authenticated;
grant all on public.society_email_preferences,public.society_email_outbox to service_role;
create policy own_email_preferences on public.society_email_preferences for all to authenticated
  using(user_id=auth.uid()) with check(user_id=auth.uid());

create function public.queue_society_notification_email() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_email text;v_enabled boolean;
begin
  -- Private warnings remain in the authenticated inbox only.
  if new.kind='warning' then return new; end if;
  select email into v_email from auth.users where id=new.recipient_id;
  if v_email is null then return new; end if;
  select case when new.kind like 'contest%' then contest_updates else society_updates end
    into v_enabled from public.society_email_preferences where user_id=new.recipient_id;
  if v_enabled is false then return new; end if;
  insert into public.society_email_outbox(notification_id,recipient_id,recipient_email,subject,body,href)
  values(new.id,new.recipient_id,v_email,new.title,coalesce(new.body,''),new.href)
  on conflict(notification_id) do nothing;
  return new;
end; $$;
create trigger queue_society_email after insert on public.society_notifications
  for each row execute function public.queue_society_notification_email();
revoke all on function public.queue_society_notification_email() from public,anon,authenticated;

create function public.claim_society_email_batch(p_limit integer default 10)
returns setof public.society_email_outbox language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if auth.role()<>'service_role' then raise exception 'Service role required'; end if;
  return query update public.society_email_outbox o set status='sending',attempts=o.attempts+1,
    locked_until=now()+interval '2 minutes'
    where o.id in (select id from public.society_email_outbox
      where ((status='pending' and next_attempt_at<=now()) or (status='sending' and locked_until<now()))
        and attempts<5 order by created_at for update skip locked limit least(greatest(p_limit,1),20))
    returning o.*;
end; $$;
revoke all on function public.claim_society_email_batch(integer) from public,anon,authenticated;
grant execute on function public.claim_society_email_batch(integer) to service_role;
