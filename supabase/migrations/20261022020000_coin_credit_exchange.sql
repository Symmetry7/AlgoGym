-- Exchange verified Coins for AI learning-path credits atomically.
alter table public.chakra_ledger drop constraint if exists chakra_ledger_entry_type_check;
alter table public.chakra_ledger add constraint chakra_ledger_entry_type_check
  check (entry_type in ('grant', 'reversal', 'credit_exchange'));
alter table public.ai_credit_ledger drop constraint if exists ai_credit_ledger_entry_type_check;
alter table public.ai_credit_ledger add constraint ai_credit_ledger_entry_type_check
  check (entry_type in ('signup_grant', 'reserve', 'release', 'plan_grant', 'coin_exchange'));

create table public.coin_credit_exchanges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_key uuid not null,
  coins integer not null check (coins in (1000, 10000)),
  credits integer not null check (credits = coins / 100),
  created_at timestamptz not null default now(),
  unique (user_id, operation_key)
);
create index coin_credit_exchanges_user_recent on public.coin_credit_exchanges(user_id, created_at desc);
alter table public.coin_credit_exchanges enable row level security;
create policy coin_credit_exchange_owner on public.coin_credit_exchanges for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.coin_credit_exchanges from public, anon, authenticated;
grant select on public.coin_credit_exchanges to authenticated;
grant all on public.coin_credit_exchanges to service_role;

create function public.exchange_coins_for_ai_credits(p_user uuid, p_operation_key uuid, p_coins integer)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_exchange public.coin_credit_exchanges; v_balance bigint; v_credits integer; v_available integer;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Service role required'; end if;
  if p_user is null or p_operation_key is null or p_coins not in (1000, 10000) then raise exception 'Invalid exchange request'; end if;
  -- Serialize requests for one user, including retries of the same operation.
  perform pg_advisory_xact_lock(hashtextextended(p_user::text, 74013));
  select * into v_exchange from public.coin_credit_exchanges
    where user_id = p_user and operation_key = p_operation_key;
  if found then
    if v_exchange.coins <> p_coins then raise exception 'Exchange key was reused for another amount'; end if;
    select balance into v_balance from public.chakra_balance_cache where user_id = p_user;
    select available into v_available from public.ai_credit_wallets where user_id = p_user;
    return jsonb_build_object('coins', coalesce(v_balance, 0), 'credits', v_available, 'exchanged', v_exchange.credits);
  end if;
  perform public.ensure_ai_credit_wallet(p_user);
  insert into public.chakra_balance_cache(user_id, balance) values (p_user, 0) on conflict (user_id) do nothing;
  select balance into v_balance from public.chakra_balance_cache where user_id = p_user for update;
  if v_balance < p_coins then raise exception 'Not enough Coins'; end if;
  v_credits := p_coins / 100;
  insert into public.coin_credit_exchanges(user_id, operation_key, coins, credits)
    values (p_user, p_operation_key, p_coins, v_credits);
  insert into public.chakra_ledger(user_id, entry_type, delta, reason)
    values (p_user, 'credit_exchange', -p_coins, 'AI credit exchange ' || p_operation_key::text);
  update public.chakra_balance_cache set balance = balance - p_coins, refreshed_at = now()
    where user_id = p_user returning balance into v_balance;
  insert into public.ai_credit_ledger(user_id, entry_type, operation_key, delta)
    values (p_user, 'coin_exchange', 'coin:' || p_operation_key::text, v_credits);
  update public.ai_credit_wallets set available = available + v_credits, updated_at = now()
    where user_id = p_user returning available into v_available;
  return jsonb_build_object('coins', v_balance, 'credits', v_available, 'exchanged', v_credits);
end; $$;
revoke all on function public.exchange_coins_for_ai_credits(uuid,uuid,integer) from public, anon, authenticated;
grant execute on function public.exchange_coins_for_ai_credits(uuid,uuid,integer) to service_role;
