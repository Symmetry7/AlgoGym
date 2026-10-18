-- All fixtures run inside the enclosing transaction and are rolled back.
do $$
declare v_user uuid; v_other uuid; v_problem uuid; v_count integer; v_total bigint; v_rating integer;
begin
 select user_id into v_user from public.coding_profiles where platform='codeforces' limit 1;
 if v_user is null then raise exception 'A verified test profile is needed for the rollback-only reward test'; end if;
 update public.profiles set chakra_activated_at=now()-interval '2 days' where id=v_user;
 update public.coding_profiles set verified_at=now()-interval '2 days' where user_id=v_user and platform='codeforces';
 insert into public.provider_snapshots(user_id,provider,history_complete) values(v_user,'codeforces',true) on conflict(user_id,provider) do update set history_complete=true;
 foreach v_rating in array array[1500,2900,3500,3501] loop
  insert into public.problems(provider,external_problem_id,title,url,cf_rating) values('codeforces','rollback-test-'||v_rating,'Rollback test','https://codeforces.com/',v_rating) returning id into v_problem;
  insert into public.solves(user_id,problem_id,first_accepted_at,proof_submission_id,proof_status) values(v_user,v_problem,now(),'rollback-test-'||v_rating,'verified');
 end loop;
 v_count:=public.award_pending_cf_solves(v_user);
 if v_count<>3 then raise exception 'Expected 3 eligible awards, received %',v_count; end if;
 select sum(delta) into v_total from public.chakra_ledger where user_id=v_user;
 if v_total<>940 then raise exception 'Expected 940 Chakra, received %',v_total; end if;
 if public.award_pending_cf_solves(v_user)<>0 then raise exception 'Duplicate awards were created'; end if;
 insert into public.problems(provider,external_problem_id,title,url,cf_rating) values('codeforces','rollback-historical','Historical test','https://codeforces.com/',1500) returning id into v_problem;
 insert into public.solves(user_id,problem_id,first_accepted_at,proof_submission_id,proof_status) values(v_user,v_problem,now()-interval '3 days','historical-test','verified');
 if public.award_pending_cf_solves(v_user)<>0 then raise exception 'A pre-activation solve earned Chakra'; end if;
 begin update public.chakra_ledger set delta=999 where user_id=v_user; raise exception 'Ledger immutability failed'; exception when raise_exception then if sqlerrm='Ledger immutability failed' then raise; end if; end;
end $$;
set local role authenticated;
do $$ begin
 begin insert into public.chakra_ledger(user_id,delta,entry_type,reason) values(gen_random_uuid(),100,'grant','forged'); raise exception 'Authenticated role can forge awards'; exception when insufficient_privilege then null; end;
 begin update public.profiles set chakra_activated_at=now()-interval '5 years'; raise exception 'Authenticated role can alter activation cutoff'; exception when insufficient_privilege then null; end;
 begin perform public.award_pending_cf_solves(gen_random_uuid()); raise exception 'Authenticated role can call the award processor'; exception when insufficient_privilege then null; end;
end $$;
reset role;
