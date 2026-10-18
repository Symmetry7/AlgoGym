-- Enclosed in BEGIN / ROLLBACK by the validation script.
do $$
declare owner_id uuid; other_id uuid; problem_id uuid;
begin
 select id into owner_id from public.profiles order by created_at limit 1;
 select id into other_id from public.profiles where id<>owner_id limit 1;
 if owner_id is null or other_id is null then raise exception 'Two existing identities are needed for isolation tests'; end if;
 perform set_config('test.study_owner',owner_id::text,true);perform set_config('test.study_other',other_id::text,true);
 update public.profiles set username='rollback_study_collaborator' where id=other_id;
 insert into public.problems(provider,external_problem_id,title,url,cf_rating) values('codeforces','rollback-study:Z','Rollback study problem','https://codeforces.com/',800) returning id into problem_id;
 perform set_config('test.study_problem',problem_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
end $$;
set local role authenticated;
do $$ declare v_sheet uuid; v_question uuid; v_invite uuid; begin
 insert into public.workspace_questions(problem_id) values(current_setting('test.study_problem')::uuid) returning id into v_question;
 insert into public.study_notes(question_id,title,body) values(v_question,'Study isolation test','Private note');
 insert into public.training_lists(title,visibility,created_by) values('Private rollback sheet','private',auth.uid()) returning id into v_sheet;
 perform set_config('test.study_sheet',v_sheet::text,true);perform set_config('test.study_question',v_question::text,true);
 perform public.add_sheet_problem(v_sheet,current_setting('test.study_problem')::uuid);
 perform public.add_sheet_problem(v_sheet,current_setting('test.study_problem')::uuid);
 if (select count(*) from public.training_items where training_list_id=v_sheet)<>1 then raise exception 'Duplicate sheet problems were created'; end if;
 v_invite:=public.invite_sheet_member(v_sheet,'rollback_study_collaborator','viewer');perform set_config('test.study_invite',v_invite::text,true);
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.study_other'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.workspace_questions where id=current_setting('test.study_question')::uuid) then raise exception 'Another user can read private workspace data'; end if;
 if exists(select 1 from public.study_notes where question_id=current_setting('test.study_question')::uuid) then raise exception 'Another user can read private notes'; end if;
 if public.can_read_sheet(current_setting('test.study_sheet')::uuid) then raise exception 'Pending invitation granted access before acceptance'; end if;
 begin insert into public.study_notes(question_id,title) values(current_setting('test.study_question')::uuid,'Forged cross-user note');raise exception 'Cross-user note link accepted';exception when insufficient_privilege then null;end;
 perform public.respond_sheet_invitation(current_setting('test.study_invite')::uuid,true);
 if not public.can_read_sheet(current_setting('test.study_sheet')::uuid) then raise exception 'Accepted viewer invitation did not grant read access'; end if;
 if public.can_edit_sheet(current_setting('test.study_sheet')::uuid) then raise exception 'Viewer can edit the sheet'; end if;
 begin perform public.add_sheet_problem(current_setting('test.study_sheet')::uuid,current_setting('test.study_problem')::uuid);raise exception 'Viewer added a problem';exception when raise_exception then if sqlerrm='Viewer added a problem' then raise;end if;end;
 update public.training_lists set title='Forged title' where id=current_setting('test.study_sheet')::uuid;
 if exists(select 1 from public.training_lists where id=current_setting('test.study_sheet')::uuid and title='Forged title') then raise exception 'Viewer edited owner metadata';end if;
 begin perform public.invite_sheet_member(current_setting('test.study_sheet')::uuid,'rollback_study_collaborator','editor');raise exception 'Viewer can invite collaborators';exception when raise_exception then if sqlerrm='Viewer can invite collaborators' then raise;end if;end;
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.study_owner'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
 update public.workspace_questions set study_status='completed',starred=true where id=current_setting('test.study_question')::uuid;
 if not exists(select 1 from public.workspace_questions where id=current_setting('test.study_question')::uuid and study_status='completed' and starred) then raise exception 'Own study progress did not persist';end if;
 if exists(select 1 from public.solves where problem_id=current_setting('test.study_problem')::uuid) or exists(select 1 from public.chakra_awards where problem_id=current_setting('test.study_problem')::uuid) then raise exception 'Manual study completion changed authoritative solve evidence';end if;
 delete from public.workspace_questions where id=current_setting('test.study_question')::uuid;
 if exists(select 1 from public.study_notes where question_id=current_setting('test.study_question')::uuid) then raise exception 'Question removal did not clean up its own notes';end if;
end $$;
reset role;
