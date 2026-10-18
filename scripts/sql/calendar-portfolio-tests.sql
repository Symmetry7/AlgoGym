do $$
declare v_user uuid; v_other uuid; v_event uuid;
begin
 select id into v_user from public.profiles order by created_at limit 1;select id into v_other from public.profiles where id<>v_user limit 1;
 perform set_config('test.calendar_user',v_user::text,true);perform set_config('test.calendar_other',v_other::text,true);
 update public.profiles set username='rollback_portfolio',is_public=false,bio='A private biography',country_code='IN' where id=v_user;
 if public.get_public_portfolio('rollback_portfolio') is not null then raise exception 'Private portfolio is publicly readable';end if;
 update public.profiles set is_public=true where id=v_user;
 if public.get_public_portfolio('ROLLBACK_PORTFOLIO')#>>'{profile,bio}'<>'A private biography' then raise exception 'Public profile projection or case normalization failed';end if;
 if public.get_public_portfolio('rollback_portfolio')->'profile' ? 'email' or public.get_public_portfolio('rollback_portfolio')->'profile' ? 'id' then raise exception 'Public portfolio exposes account identity';end if;
 insert into public.contest_events(provider,external_id,title,url,starts_at,ends_at) values('codeforces','rollback-calendar','Rollback calendar event','https://codeforces.com/',now()+interval '1 day',now()+interval '1 day 2 hours') returning id into v_event;
 perform set_config('test.calendar_event',v_event::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',v_user,'role','authenticated')::text,true);
end $$;
set local role authenticated;
do $$ begin
 perform public.subscribe_to_contest(current_setting('test.calendar_event')::uuid);perform public.subscribe_to_contest(current_setting('test.calendar_event')::uuid);
 if (select count(*) from public.contest_subscriptions where event_id=current_setting('test.calendar_event')::uuid)<>1 then raise exception 'Repeated subscription created duplicate rows';end if;
 begin insert into public.contest_events(provider,external_id,title,url,starts_at,ends_at) values('codeforces','forged','Forged','https://codeforces.com/',now(),now()+interval '1 hour');raise exception 'Client can forge public contest events';exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.calendar_other'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.contest_subscriptions where event_id=current_setting('test.calendar_event')::uuid) then raise exception 'Another user can read private subscriptions';end if;
 if not exists(select 1 from public.contest_subscription_counts(array[current_setting('test.calendar_event')::uuid]) where subscribers=1) then raise exception 'Aggregate subscription count is incorrect';end if;
 delete from public.contest_subscriptions where event_id=current_setting('test.calendar_event')::uuid;
end $$;
reset role;
do $$ begin if (select count(*) from public.contest_subscriptions where event_id=current_setting('test.calendar_event')::uuid)<>1 then raise exception 'Another user deleted a private subscription';end if;end $$;
set local role anon;
do $$ begin
 if public.get_public_portfolio('rollback_portfolio')#>>'{profile,username}'<>'rollback_portfolio' then raise exception 'Opted-in public portfolio cannot be read anonymously';end if;
 begin perform public.subscribe_to_contest(current_setting('test.calendar_event')::uuid);raise exception 'Anonymous role can subscribe';exception when insufficient_privilege then null;end;
end $$;
reset role;
