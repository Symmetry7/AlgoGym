-- Transaction-only fixtures. No user or production evidence is deleted.
do $$
declare v_user uuid; v_handle text; v_job uuid; v_lease uuid:=gen_random_uuid(); v_count integer;
begin
 select user_id,username into v_user,v_handle from public.coding_profiles where platform='codeforces' limit 1;
 insert into public.sync_jobs(user_id,provider,status,leased_until,lease_token) values(v_user,'codeforces','running',now()+interval '1 minute',v_lease) returning id into v_job;
 v_count:=public.ingest_cf_page(v_job,v_lease,jsonb_build_array(
  jsonb_build_object('id',990000000001,'contestId',990000001,'creationTimeSeconds',extract(epoch from now()),'relativeTimeSeconds',100,'verdict','WRONG_ANSWER','programmingLanguage','GNU C++20','timeConsumedMillis',0,'memoryConsumedBytes',1024,'author',jsonb_build_object('members',jsonb_build_array(jsonb_build_object('handle',v_handle)),'participantType','CONTESTANT'),'problem',jsonb_build_object('contestId',990000001,'index','A','name','Rollback-only WA','rating',1500,'tags',jsonb_build_array('dp'))),
  jsonb_build_object('id',990000000002,'contestId',990000001,'creationTimeSeconds',extract(epoch from now()),'relativeTimeSeconds',200,'verdict','OK','programmingLanguage','GNU C++20','timeConsumedMillis',15,'memoryConsumedBytes',2048,'author',jsonb_build_object('members',jsonb_build_array(jsonb_build_object('handle',v_handle)),'participantType','CONTESTANT'),'problem',jsonb_build_object('contestId',990000001,'index','B','name','Rollback-only AC','rating',1500,'tags',jsonb_build_array('greedy'))),
  jsonb_build_object('id',990000000003,'contestId',990000001,'creationTimeSeconds',extract(epoch from now()),'verdict','OK','author',jsonb_build_object('members',jsonb_build_array(jsonb_build_object('handle','not-the-linked-handle'))),'problem',jsonb_build_object('contestId',990000001,'index','C','name','Wrong author'))
 ));
 if v_count<>2 then raise exception 'Expected both WA and AC, but reject mismatched author'; end if;
 if (select count(*) from public.provider_submissions where provider_submission_id in ('990000000001','990000000002'))<>2 then raise exception 'Submission evidence missing'; end if;
 if exists(select 1 from public.solves s join public.problems p on p.id=s.problem_id where p.external_problem_id='990000001:A') then raise exception 'A failed attempt became a verified solve'; end if;
 if not exists(select 1 from public.solves s join public.problems p on p.id=s.problem_id where p.external_problem_id='990000001:B' and s.proof_status='verified') then raise exception 'The accepted solve was not recorded'; end if;
 if exists(select 1 from public.chakra_awards a join public.problems p on p.id=a.problem_id where p.external_problem_id like '990000001:%') then raise exception 'Ingest awarded Chakra before award processing'; end if;
 if not exists(select 1 from public.provider_submissions where provider_submission_id='990000000002' and runtime_ms=15 and memory_bytes=2048 and relative_time_seconds=200 and participant_type='CONTESTANT') then raise exception 'Public submission metadata was lost'; end if;
end $$;
set local role authenticated;
do $$ begin
 begin insert into public.provider_submissions(provider,provider_submission_id,user_id,verdict,submitted_at) values('codeforces','forged',gen_random_uuid(),'OK',now()); raise exception 'Client can forge submission evidence'; exception when insufficient_privilege then null; end;
end $$;
reset role;
