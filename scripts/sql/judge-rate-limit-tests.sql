-- M11 checks for judge_take_slot (20261127010000_judge_rate_limits.sql). One transaction, rolled back.
-- Run: node scripts/ops/staging-sql.mjs test scripts/sql/judge-rate-limit-tests.sql  (staging only, never production)
begin;
insert into auth.users (id, aud, role, email) values
  ('c3333333-0000-4000-8000-00000000000c', 'authenticated', 'authenticated', 'rate-c@example.test'),
  ('d4444444-0000-4000-8000-00000000000d', 'authenticated', 'authenticated', 'rate-d@example.test');

do $$
declare wait integer;
begin
  -- 10 submits a minute are granted, the 11th is refused with a positive wait.
  for i in 1..10 loop
    if public.judge_take_slot('c3333333-0000-4000-8000-00000000000c', 'submit') <> 0 then raise exception 'FAIL: submit % refused', i; end if;
  end loop;
  wait := public.judge_take_slot('c3333333-0000-4000-8000-00000000000c', 'submit');
  if wait < 1 or wait > 60 then raise exception 'FAIL: 11th submit should wait 1-60 s, got %', wait; end if;
  -- Runs have their own budget, and other users are unaffected.
  if public.judge_take_slot('c3333333-0000-4000-8000-00000000000c', 'run') <> 0 then raise exception 'FAIL: run blocked by submits'; end if;
  if public.judge_take_slot('d4444444-0000-4000-8000-00000000000d', 'submit') <> 0 then raise exception 'FAIL: other user blocked'; end if;
  -- 30 runs per 5 minutes.
  for i in 2..30 loop
    if public.judge_take_slot('c3333333-0000-4000-8000-00000000000c', 'run') <> 0 then raise exception 'FAIL: run % refused', i; end if;
  end loop;
  wait := public.judge_take_slot('c3333333-0000-4000-8000-00000000000c', 'run');
  if wait < 1 or wait > 300 then raise exception 'FAIL: 31st run should wait 1-300 s, got %', wait; end if;
  -- Events older than the window don't count.
  update public.judge_rate_events set created_at = now() - interval '2 minutes' where user_id = 'c3333333-0000-4000-8000-00000000000c' and mode = 'submit';
  if public.judge_take_slot('c3333333-0000-4000-8000-00000000000c', 'submit') <> 0 then raise exception 'FAIL: expired events still counted'; end if;
end $$;

-- Clients can't call it or read the table.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c3333333-0000-4000-8000-00000000000c","role":"authenticated"}', true);
do $$ begin perform public.judge_take_slot('c3333333-0000-4000-8000-00000000000c', 'run'); raise exception 'FAIL: client can take slots';
exception when insufficient_privilege then null; end $$;
do $$ begin perform 1 from public.judge_rate_events; raise exception 'FAIL: client can read rate events';
exception when insufficient_privilege then null; end $$;
reset role;
rollback;
