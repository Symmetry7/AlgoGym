-- Self-service societies and shareable invitations. Existing records are preserved.
alter table public.societies alter column college_id drop not null;
create table public.society_invites (
 society_id uuid primary key references public.societies(id) on delete cascade,
 token text not null unique default (replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','')),
 created_at timestamptz not null default now()
);
alter table public.society_invites enable row level security;
revoke all on public.society_invites from public,anon,authenticated;
grant all on public.society_invites to service_role;

create or replace function public.register_society(p_college uuid,p_name text,p_slug text,p_description text,p_evidence text)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_society uuid; v_user uuid:=auth.uid();
begin
 if v_user is null then raise exception 'Authentication required';end if;
 if p_name is null or length(trim(p_name)) not between 3 and 100 or p_slug is null or p_slug !~ '^[a-z0-9][a-z0-9-]{2,79}$' or length(coalesce(p_description,''))>2000 then raise exception 'Enter valid society details';end if;
 if p_college is not null and not exists(select 1 from public.colleges where id=p_college and status='approved') then raise exception 'Choose a valid college';end if;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text||'society-create',0));
 if (select count(*) from public.societies where created_by=v_user and created_at>now()-interval '1 day')>=3 then raise exception 'You can create up to three societies per day';end if;
 insert into public.societies(college_id,name,slug,description,created_by,status) values(p_college,trim(p_name),p_slug,coalesce(p_description,''),v_user,'approved') returning id into v_society;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text||'membership',0));
 insert into public.memberships(user_id,society_id,role,status,competitive) values(v_user,v_society,'admin','active',not exists(select 1 from public.memberships where user_id=v_user and status='active' and competitive and effective_to is null));
 insert into public.society_invites(society_id) values(v_society);
 return v_society;
end; $$;

create or replace function public.apply_to_society(p_society_id uuid) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid; v_user uuid:=auth.uid(); v_competitive boolean;
begin
 if v_user is null then raise exception 'Authentication required';end if;
 if not exists(select 1 from public.societies where id=p_society_id and status='approved') then raise exception 'Society unavailable';end if;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text||'membership',0));
 if exists(select 1 from public.memberships where user_id=v_user and society_id=p_society_id and status='suspended') then raise exception 'Your membership is suspended';end if;
 select id into v_id from public.memberships where user_id=v_user and society_id=p_society_id and status='active' and effective_to is null limit 1;
 if found then return v_id;end if;
 if (select count(*) from public.memberships where user_id=v_user and created_at>now()-interval '1 hour')>=20 then raise exception 'Please wait before joining more societies';end if;
 v_competitive:=not exists(select 1 from public.memberships where user_id=v_user and status='active' and competitive and effective_to is null);
 select id into v_id from public.memberships where user_id=v_user and society_id=p_society_id and status='pending' limit 1;
 if found then update public.memberships set status='active',role='member',competitive=v_competitive,effective_from=now(),effective_to=null where id=v_id;
 else insert into public.memberships(user_id,society_id,status,competitive) values(v_user,p_society_id,'active',v_competitive) returning id into v_id;end if;
 return v_id;
end; $$;

create function public.get_society_invite(p_society uuid) returns text language plpgsql security definer set search_path=public,pg_temp as $$
declare v_token text;
begin
 if auth.uid() is null or not exists(select 1 from public.memberships where user_id=auth.uid() and society_id=p_society and status='active' and effective_to is null) then raise exception 'Active membership required';end if;
 if not exists(select 1 from public.societies where id=p_society and status='approved') then raise exception 'Society unavailable';end if;
 insert into public.society_invites(society_id) values(p_society) on conflict do nothing;
 select token into v_token from public.society_invites where society_id=p_society;return v_token;
end; $$;
create function public.preview_society_invite(p_token text) returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select jsonb_build_object('id',s.id,'name',s.name,'slug',s.slug,'description',s.description,'college',c.name)
 from public.society_invites i join public.societies s on s.id=i.society_id left join public.colleges c on c.id=s.college_id
 where i.token=p_token and length(p_token)=64 and s.status='approved';
$$;
create function public.join_society_invite(p_token text) returns text language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.societies;
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 select so.* into s from public.societies so join public.society_invites i on i.society_id=so.id where i.token=p_token and length(p_token)=64 and so.status='approved';
 if not found then raise exception 'This invitation is unavailable';end if;
 perform public.apply_to_society(s.id);return s.slug;
end; $$;
revoke all on function public.get_society_invite(uuid),public.preview_society_invite(text),public.join_society_invite(text) from public,anon,authenticated;
grant execute on function public.get_society_invite(uuid),public.join_society_invite(text) to authenticated;
grant execute on function public.preview_society_invite(text) to anon,authenticated;
-- Existing register/apply function ownership and restricted grants are retained.
