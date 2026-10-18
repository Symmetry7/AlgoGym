begin;
do $$
declare v_user uuid; v_policy uuid; v_path uuid; v_module uuid; v_other uuid; v_lesson uuid; v_problem uuid; v_solve uuid; v_points integer; v_cross boolean:=false;
begin
  select id into v_user from auth.users limit 1;
  select id into v_policy from public.chakra_policies where status='active' limit 1;
  if v_user is null or v_policy is null then raise notice 'Skipping module claim flow: no existing user or active policy'; return; end if;
  insert into public.problems(provider,external_problem_id,title,url,cf_rating) values('codeforces','symm-test-'||gen_random_uuid()::text,'Symm test','https://codeforces.com/problemset/problem/1/A',800) returning id into v_problem;
  insert into public.ai_learning_paths(user_id,request_id,topic,title,level,goal,hours_per_week,category,status) values(v_user,gen_random_uuid(),'Test algorithms','Test algorithms','beginner','competitive',5,'competitive','ready') returning id into v_path;
  insert into public.ai_learning_modules(path_id,position,title) values(v_path,0,'First module') returning id into v_module;
  insert into public.ai_learning_lessons(module_id,position,title,status) values(v_module,0,'First lesson','ready') returning id into v_lesson;
  insert into public.ai_learning_progress(user_id,lesson_id) values(v_user,v_lesson);
  insert into public.ai_recommended_problems(module_id,problem_id,position) values(v_module,v_problem,0);
  insert into public.solves(user_id,problem_id,first_accepted_at,proof_submission_id,proof_status) values(v_user,v_problem,now(),'symm-test-'||gen_random_uuid()::text,'verified') returning id into v_solve;
  insert into public.chakra_awards(user_id,problem_id,solve_id,policy_id,difficulty_snapshot,points) values(v_user,v_problem,v_solve,v_policy,'{"provider":"codeforces","rating":800}',10);
  perform set_config('request.jwt.claim.sub',v_user::text,true);
  v_points:=public.claim_symm_module_award(v_module);
  if v_points<>25 then raise exception 'Expected 25 Chakra for completed module'; end if;
  if public.claim_symm_module_award(v_module)<>0 then raise exception 'Duplicate claim paid again'; end if;
  if (select count(*) from public.ai_module_awards where user_id=v_user and module_id=v_module)<>1 then raise exception 'Duplicate module award'; end if;
  insert into public.ai_learning_modules(path_id,position,title) values(v_path,1,'Second module') returning id into v_other;
  insert into public.ai_learning_lessons(module_id,position,title,status) values(v_other,0,'Unfinished lesson','ready');
  insert into public.ai_recommended_problems(module_id,problem_id,position) values(v_other,v_problem,0);
  begin perform public.claim_symm_module_award(v_other); raise exception 'Incomplete lesson claimed reward'; exception when others then if sqlerrm='Incomplete lesson claimed reward' then raise; end if; end;
  perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
  begin perform public.claim_symm_module_award(v_module); raise exception 'Other user claimed reward'; exception when others then if sqlerrm='Other user claimed reward' then raise; end if; end;
  raise notice 'Module reward flow, duplicate claim, incomplete lesson and ownership checks passed';
end $$;
rollback;
