-- Subscription state is private and can only be changed by the billing server.
create table public.billing_subscriptions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  tier text not null check (tier in ('pro','premium')),
  plan_id text not null,
  status text not null default 'created',
  paid_count integer not null default 0 check (paid_count >= 0),
  current_start timestamptz,
  current_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index billing_subscriptions_user_recent on public.billing_subscriptions(user_id, created_at desc);
alter table public.billing_subscriptions enable row level security;
create policy billing_subscription_owner on public.billing_subscriptions for select to authenticated using (user_id=(select auth.uid()));
revoke all on public.billing_subscriptions from public,anon,authenticated;
grant select on public.billing_subscriptions to authenticated;
grant all on public.billing_subscriptions to service_role;

alter table public.ai_credit_ledger drop constraint if exists ai_credit_ledger_entry_type_check;
alter table public.ai_credit_ledger add constraint ai_credit_ledger_entry_type_check
  check (entry_type in ('signup_grant','reserve','release','plan_grant'));

-- One successful monthly charge contributes one allocation. The ledger key
-- makes webhook retries and status reconciliation idempotent.
create function public.apply_billing_cycle(p_subscription text,p_paid_count integer,p_status text,p_start timestamptz,p_end timestamptz)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_sub public.billing_subscriptions; v_count integer; v_amount integer; v_cycle integer; v_available integer;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Service role required'; end if;
  if p_paid_count is null or p_paid_count < 0 or p_paid_count > 120 then raise exception 'Invalid billing count'; end if;
  select * into v_sub from public.billing_subscriptions where id=p_subscription for update;
  if not found then raise exception 'Subscription not found'; end if;
  if p_paid_count < v_sub.paid_count then raise exception 'Billing count cannot decrease'; end if;
  perform public.ensure_ai_credit_wallet(v_sub.user_id);
  perform 1 from public.ai_credit_wallets where user_id=v_sub.user_id for update;
  v_amount:=case v_sub.tier when 'pro' then 50 else 150 end;
  for v_cycle in (v_sub.paid_count+1)..p_paid_count loop
    insert into public.ai_credit_ledger(user_id,entry_type,operation_key,delta)
      values(v_sub.user_id,'plan_grant','subscription:'||v_sub.id||':'||v_cycle,v_amount)
      on conflict do nothing;
    if found then
      update public.ai_credit_wallets set available=available+v_amount,updated_at=now() where user_id=v_sub.user_id;
    end if;
  end loop;
  update public.billing_subscriptions set status=p_status,paid_count=p_paid_count,
    current_start=p_start,current_end=p_end,updated_at=now() where id=v_sub.id;
  select available into v_available from public.ai_credit_wallets where user_id=v_sub.user_id;
  return jsonb_build_object('available',v_available,'tier',v_sub.tier,'paid_count',p_paid_count);
end; $$;
revoke all on function public.apply_billing_cycle(text,integer,text,timestamptz,timestamptz) from public,anon,authenticated;
grant execute on function public.apply_billing_cycle(text,integer,text,timestamptz,timestamptz) to service_role;
