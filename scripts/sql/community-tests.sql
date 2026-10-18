do $$
declare v_owner uuid; v_other uuid; v_college uuid;
begin
 select cp.user_id into v_owner from public.coding_profiles cp join public.provider_snapshots s on s.user_id=cp.user_id and s.provider=cp.platform where cp.platform='codeforces' and jsonb_typeof(s.summary->'rating')='number' and s.last_synced_at>now()-interval '7 days' limit 1;select id into v_other from public.profiles where id<>v_owner limit 1;
 select id into v_college from public.colleges where status='approved' limit 1;
 perform set_config('test.community_owner',v_owner::text,true);perform set_config('test.community_other',v_other::text,true);perform set_config('test.community_college',v_college::text,true);
 update public.profiles set is_public=true,username='rollback_rank_test',country_code='IN',college_id=v_college,onboarding_completed_at=coalesce(onboarding_completed_at,now()) where id=v_owner;
 insert into public.platform_admins(user_id) values(v_owner) on conflict(user_id) do update set revoked_at=null;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',v_other,'role','authenticated')::text,true);
end $$;
set local role authenticated;
do $$ declare v_society uuid; v_application uuid; begin
 if public.is_platform_admin() then raise exception 'Ordinary member received platform-admin rights';end if;
 begin perform public.community_review_queue();raise exception 'Ordinary member can read private review data';exception when raise_exception then if sqlerrm='Ordinary member can read private review data' then raise;end if;end;
 v_society:=public.register_society(current_setting('test.community_college')::uuid,'Rollback Society','rollback-only-society','Transaction-only test','https://example.org/society');
 select id into v_application from public.society_applications where society_id=v_society;
 perform set_config('test.community_society',v_society::text,true);perform set_config('test.community_application',v_application::text,true);
 if exists(select 1 from public.memberships where society_id=v_society and status='active') then raise exception 'Society applicant was approved automatically';end if;
 begin perform public.review_community_request('society',v_application,true,'forged');raise exception 'Applicant approved their own society';exception when raise_exception then if sqlerrm='Applicant approved their own society' then raise;end if;end;
 begin perform public.enqueue_due_profile_syncs();raise exception 'Ordinary member can enqueue arbitrary profile jobs';exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.community_owner'),'role','authenticated')::text,true);
set local role authenticated;
do $$ declare v_request uuid; begin
 if not public.is_platform_admin() then raise exception 'Designated platform admin cannot review';end if;
 perform public.review_community_request('society',current_setting('test.community_application')::uuid,true,'Rollback review evidence checked');
 begin perform public.review_community_request('society',current_setting('test.community_application')::uuid,true,'replay');raise exception 'Repeated application review succeeded';exception when raise_exception then if sqlerrm='Repeated application review succeeded' then raise;end if;end;
 v_request:=public.apply_to_society(current_setting('test.community_society')::uuid);perform set_config('test.community_membership',v_request::text,true);
 if public.apply_to_society(current_setting('test.community_society')::uuid)<>v_request then raise exception 'Duplicate membership request created';end if;
 if not (public.read_leaderboard('individual','codeforces_rating','IN')->'entries' @> '[{"username":"rollback_rank_test"}]'::jsonb) then raise exception 'Verified public member is absent from country ranking';end if;
 if public.read_leaderboard('individual','codeforces_rating','US')->'entries' @> '[{"username":"rollback_rank_test"}]'::jsonb then raise exception 'Country filter was ignored';end if;
 update public.profiles set is_public=false where id=auth.uid();
 if public.read_leaderboard('individual','codeforces_rating')->'entries' @> '[{"username":"rollback_rank_test"}]'::jsonb then raise exception 'Private profile remains publicly ranked';end if;
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.community_other'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
 if not exists(select 1 from public.memberships where society_id=current_setting('test.community_society')::uuid and user_id=auth.uid() and role='admin' and status='active') then raise exception 'Approved society did not receive its organizer role';end if;
 perform public.review_society_membership(current_setting('test.community_membership')::uuid,'active');
 if public.review_society_membership(current_setting('test.community_membership')::uuid,'active') then raise exception 'Completed membership review was replayed';end if;
end $$;
reset role;
set local role anon;
do $$ begin
 if public.read_leaderboard('society','chakra')->>'minimumEligible'<>'5' then raise exception 'Society normalization criteria are missing';end if;
 if public.read_leaderboard('individual','codeforces_rating')->'entries' @> '[{"username":"rollback_rank_test"}]'::jsonb then raise exception 'Anonymous ranking leaks a private profile';end if;
end $$;
reset role;
