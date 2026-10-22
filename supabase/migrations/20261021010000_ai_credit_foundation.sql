-- AlgoGym AI credits are separate from verified-solve Coins/Chakra.
-- This migration adds the free signup wallet and atomic reservation primitives.
-- Paid-period allocations and billing events require a verified merchant integration.

create table public.ai_credit_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  available integer not null default 0 check (available >= 0),
  updated_at timestamptz not null default now()
);

create table public.ai_credit_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_key text not null check (length(operation_key) between 8 and 200),
  amount integer not null check (amount between 1 and 10),
  status text not null default 'reserved' check (status in ('reserved', 'settled', 'released')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, operation_key)
);
create index ai_credit_reservations_owner_status on public.ai_credit_reservations(user_id, status, created_at desc);

create table public.ai_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_type text not null check (entry_type in ('signup_grant', 'reserve', 'release')),
  operation_key text not null,
  delta integer not null check (delta <> 0),
  created_at timestamptz not null default now(),
  unique (user_id, entry_type, operation_key),
  check ((entry_type = 'reserve' and delta < 0) or (entry_type <> 'reserve' and delta > 0))
);
create index ai_credit_ledger_owner_recent on public.ai_credit_ledger(user_id, created_at desc);

alter table public.ai_credit_wallets enable row level security;
alter table public.ai_credit_reservations enable row level security;
alter table public.ai_credit_ledger enable row level security;
create policy ai_credit_wallet_owner on public.ai_credit_wallets for select to authenticated using (user_id = (select auth.uid()));
create policy ai_credit_reservation_owner on public.ai_credit_reservations for select to authenticated using (user_id = (select auth.uid()));
create policy ai_credit_ledger_owner on public.ai_credit_ledger for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.ai_credit_wallets, public.ai_credit_reservations, public.ai_credit_ledger from public, anon, authenticated;
grant select on public.ai_credit_wallets, public.ai_credit_reservations, public.ai_credit_ledger to authenticated;
grant all on public.ai_credit_wallets, public.ai_credit_reservations, public.ai_credit_ledger to service_role;
-- Ledger entries are written by the security-definer functions, never edited
-- directly through the API. Account deletion can still cascade its private rows.
revoke insert, update, delete, truncate on public.ai_credit_ledger from service_role;

create function public.ensure_ai_credit_wallet(p_user uuid)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare v_created uuid; v_available integer;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Service role required'; end if;
  if p_user is null or not exists (select 1 from auth.users where id = p_user) then raise exception 'User not found'; end if;
  insert into public.ai_credit_wallets(user_id, available) values (p_user, 3)
    on conflict (user_id) do nothing returning user_id into v_created;
  if v_created is not null then
    insert into public.ai_credit_ledger(user_id, entry_type, operation_key, delta)
      values (p_user, 'signup_grant', 'first_signup', 3);
  end if;
  select available into v_available from public.ai_credit_wallets where user_id = p_user;
  return v_available;
end; $$;

create function public.reserve_ai_credits(p_user uuid, p_operation_key text, p_amount integer)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_wallet public.ai_credit_wallets; v_reservation public.ai_credit_reservations;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Service role required'; end if;
  if p_operation_key is null or p_amount is null or length(p_operation_key) not between 8 and 200 or p_amount not between 1 and 10 then raise exception 'Invalid credit operation'; end if;
  perform public.ensure_ai_credit_wallet(p_user);
  select * into v_wallet from public.ai_credit_wallets where user_id = p_user for update;
  select * into v_reservation from public.ai_credit_reservations
    where user_id = p_user and operation_key = p_operation_key;
  if found then
    if v_reservation.amount <> p_amount then raise exception 'Credit operation amount mismatch'; end if;
    return jsonb_build_object('id', v_reservation.id, 'status', v_reservation.status, 'available', v_wallet.available);
  end if;
  if v_wallet.available < p_amount then raise exception 'Insufficient AI credits'; end if;
  insert into public.ai_credit_reservations(user_id, operation_key, amount)
    values (p_user, p_operation_key, p_amount) returning * into v_reservation;
  update public.ai_credit_wallets set available = available - p_amount, updated_at = now() where user_id = p_user;
  insert into public.ai_credit_ledger(user_id, entry_type, operation_key, delta)
    values (p_user, 'reserve', p_operation_key, -p_amount);
  return jsonb_build_object('id', v_reservation.id, 'status', 'reserved', 'available', v_wallet.available - p_amount);
end; $$;

create function public.finish_ai_credit_reservation(p_user uuid, p_operation_key text, p_succeeded boolean)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_reservation public.ai_credit_reservations; v_balance integer;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Service role required'; end if;
  if p_succeeded is null then raise exception 'Generation outcome required'; end if;
  perform 1 from public.ai_credit_wallets where user_id=p_user for update;
  select * into v_reservation from public.ai_credit_reservations
    where user_id = p_user and operation_key = p_operation_key for update;
  if not found then raise exception 'Reservation not found'; end if;
  if v_reservation.status = 'reserved' then
    if p_succeeded then
      update public.ai_credit_reservations set status = 'settled', updated_at = now() where id = v_reservation.id;
    else
      update public.ai_credit_wallets set available = available + v_reservation.amount, updated_at = now() where user_id = p_user;
      insert into public.ai_credit_ledger(user_id, entry_type, operation_key, delta)
        values (p_user, 'release', p_operation_key, v_reservation.amount);
      update public.ai_credit_reservations set status = 'released', updated_at = now() where id = v_reservation.id;
    end if;
  end if;
  select available into v_balance from public.ai_credit_wallets where user_id = p_user;
  return jsonb_build_object('id', v_reservation.id, 'status',
    (select status from public.ai_credit_reservations where id = v_reservation.id), 'available', v_balance);
end; $$;

revoke all on function public.ensure_ai_credit_wallet(uuid), public.reserve_ai_credits(uuid, text, integer), public.finish_ai_credit_reservation(uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.ensure_ai_credit_wallet(uuid), public.reserve_ai_credits(uuid, text, integer), public.finish_ai_credit_reservation(uuid, text, boolean) to service_role;

-- Wallet locking serializes concurrent requests for one user. Path, job, and
-- reservation are created together: a network retry cannot double-spend.
create function public.queue_symm_credit_path(p_user uuid, p_input jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_path public.ai_learning_paths; v_job public.ai_generation_jobs; v_key text; v_prior_key text;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Service role required'; end if;
  perform public.ensure_ai_credit_wallet(p_user);
  perform 1 from public.ai_credit_wallets where user_id=p_user for update;
  if p_input->>'action' = 'path.generate' then
    select * into v_path from public.ai_learning_paths where user_id=p_user and request_id=(p_input->>'requestId')::uuid;
    if found then return jsonb_build_object('pathId',v_path.id,'status',v_path.status); end if;
    insert into public.ai_learning_paths(user_id,request_id,topic,title,level,goal,hours_per_week,preferred_language)
    values(p_user,(p_input->>'requestId')::uuid,p_input->>'topic',p_input->>'topic',p_input->>'level',p_input->>'goal',(p_input->>'hoursPerWeek')::integer,p_input->>'language') returning * into v_path;
    insert into public.ai_generation_jobs(user_id,resource_type,resource_id,idempotency_key)
    values(p_user,'path',v_path.id,p_input->>'requestId') returning * into v_job;
  elsif p_input->>'action' = 'path.retry' then
    select * into v_path from public.ai_learning_paths where id=(p_input->>'pathId')::uuid and user_id=p_user for update;
    if not found then raise exception 'Learning path not found'; end if;
    if v_path.status <> 'failed' then return jsonb_build_object('pathId',v_path.id,'status',v_path.status); end if;
    select * into v_job from public.ai_generation_jobs where user_id=p_user and resource_type='path' and resource_id=v_path.id for update;
    if not found or v_job.attempt_count >= 3 then raise exception 'Retry limit reached'; end if;
    -- A failed worker may not have reached its refund. Release that attempt
    -- while holding the wallet lock before reserving the retry; otherwise a
    -- later successful run could settle both attempts and double-charge.
    for v_prior_key in
      select operation_key from public.ai_credit_reservations
      where user_id=p_user and operation_key like 'path:' || v_path.id::text || ':%'
        and status='reserved'
    loop
      perform public.finish_ai_credit_reservation(p_user,v_prior_key,false);
    end loop;
    update public.ai_generation_jobs set status='queued',stage='queued',error_code=null,queued_at=now() where id=v_job.id;
    update public.ai_learning_paths set status='generating',updated_at=now() where id=v_path.id;
  else raise exception 'Unsupported credit operation'; end if;
  v_key := 'path:' || v_path.id::text || ':' || v_job.attempt_count::text;
  perform public.reserve_ai_credits(p_user,v_key,1);
  return jsonb_build_object('pathId',v_path.id,'status','generating');
end; $$;
revoke all on function public.queue_symm_credit_path(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.queue_symm_credit_path(uuid,jsonb) to service_role;
