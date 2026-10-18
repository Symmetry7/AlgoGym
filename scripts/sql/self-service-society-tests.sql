do $$
declare u uuid; other_user uuid; s uuid; t text; membership uuid; caught boolean;
begin
 select id into u from auth.users order by created_at limit 1;
 select id into other_user from auth.users where id<>u limit 1;
 perform set_config('request.jwt.claim.sub',u::text,true);
 s:=public.register_society(null,'Rollback Society','rollback-'||replace(gen_random_uuid()::text,'-',''),'Test',null);
 if not exists(select 1 from public.societies where id=s and status='approved' and approved_by is null) then raise exception 'Self-service creation failed';end if;
 if not exists(select 1 from public.memberships where society_id=s and user_id=u and status='active' and role='admin') then raise exception 'Creator not admin';end if;
 t:=public.get_society_invite(s);
 if length(t)<>64 or t<>public.get_society_invite(s) then raise exception 'Invitation not persistent';end if;
 if public.preview_society_invite(t)->>'id'<>s::text then raise exception 'Preview failed';end if;
 if public.preview_society_invite(repeat('0',64)) is not null then raise exception 'Invalid invitation accepted';end if;
 perform set_config('request.jwt.claim.sub',other_user::text,true);
 caught:=false;begin perform public.get_society_invite(s);exception when others then caught:=true;end;
 if not caught then raise exception 'Nonmember can retrieve invitation';end if;
 perform public.join_society_invite(t);perform public.join_society_invite(t);
 if (select count(*) from public.memberships where society_id=s and user_id=other_user and status='active')<>1 then raise exception 'Join not idempotent';end if;
 if not exists(select 1 from public.memberships where society_id=s and user_id=other_user and role='member') then raise exception 'Join role escalation';end if;
 if public.get_society_invite(s)<>t then raise exception 'Members cannot share';end if;
 update public.memberships set status='suspended' where society_id=s and user_id=other_user;
 caught:=false;begin perform public.join_society_invite(t);exception when others then caught:=true;end;
 if not caught then raise exception 'Suspension bypass';end if;
 perform set_config('request.jwt.claim.sub','',true);
 caught:=false;begin perform public.join_society_invite(t);exception when others then caught:=true;end;
 if not caught then raise exception 'Anonymous join accepted';end if;
 if has_table_privilege('authenticated','public.society_invites','select') or has_table_privilege('anon','public.society_invites','select') then raise exception 'Invitation table exposed';end if;
 if has_function_privilege('anon','public.get_society_invite(uuid)','execute') or has_function_privilege('anon','public.register_society(uuid,text,text,text,text)','execute') then raise exception 'Privileged RPC exposed';end if;
end;$$;
