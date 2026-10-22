-- Run only in a disposable/staging database after the credit migration.
-- Requires a test identity with at least one free credit. Always rolls back.
begin;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
do $$
declare
  v_user uuid;
  v_before integer;
  v_result jsonb;
  v_path uuid;
  v_request uuid := gen_random_uuid();
begin
  select id into v_user from auth.users order by created_at limit 1;
  if v_user is null then raise exception 'A staging test identity is required'; end if;
  v_before := public.ensure_ai_credit_wallet(v_user);
  if v_before < 1 then raise exception 'Test identity needs an available credit'; end if;
  v_result := public.queue_symm_credit_path(v_user, jsonb_build_object(
    'action','path.generate','requestId',v_request,'topic','Credit retry regression',
    'level','beginner','goal','fundamentals','hoursPerWeek',5,'language','cpp'));
  v_path := (v_result->>'pathId')::uuid;
  -- Simulate failed generation whose refund RPC never completed.
  update public.ai_learning_paths set status='failed' where id=v_path;
  update public.ai_generation_jobs set status='failed',attempt_count=1
    where resource_type='path' and resource_id=v_path;
  perform public.queue_symm_credit_path(v_user,jsonb_build_object('action','path.retry','pathId',v_path));
  if (select available from public.ai_credit_wallets where user_id=v_user) <> v_before-1
    then raise exception 'Retry double-charged the wallet'; end if;
  if (select status from public.ai_credit_reservations where user_id=v_user and operation_key='path:'||v_path::text||':0') <> 'released'
    then raise exception 'Failed attempt reservation was not released'; end if;
  perform public.finish_ai_credit_reservation(v_user,'path:'||v_path::text||':1',true);
  -- Repeated settlement must not debit or refund again.
  perform public.finish_ai_credit_reservation(v_user,'path:'||v_path::text||':1',true);
  if (select available from public.ai_credit_wallets where user_id=v_user) <> v_before-1
    then raise exception 'Settlement changed the reserved balance'; end if;
end $$;
rollback;
