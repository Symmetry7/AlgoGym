-- Personal study state is independent of authoritative solves and Chakra.
create table public.workspace_questions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 problem_id uuid not null references public.problems(id) on delete cascade,
 study_status text not null default 'planned' check(study_status in ('planned','in_progress','completed')),
 starred boolean not null default false,
 custom_tags text[] not null default '{}' check(cardinality(custom_tags)<=10),
 last_reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(user_id,problem_id)
);
create index workspace_questions_user_updated on public.workspace_questions(user_id,updated_at desc);
create table public.study_notes (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 question_id uuid references public.workspace_questions(id) on delete cascade,
 title text not null check(length(trim(title)) between 1 and 160),
 body text not null default '' check(length(body)<=40000),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create unique index question_one_note on public.study_notes(question_id) where question_id is not null;
create index study_notes_user_updated on public.study_notes(user_id,updated_at desc);
alter table public.workspace_questions enable row level security;
alter table public.study_notes enable row level security;
revoke all on public.workspace_questions,public.study_notes from public,anon,authenticated;
grant select,insert,update,delete on public.workspace_questions,public.study_notes to authenticated;
grant all on public.workspace_questions,public.study_notes to service_role;
create policy own_workspace on public.workspace_questions for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy own_notes on public.study_notes for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and (question_id is null or exists(select 1 from public.workspace_questions q where q.id=question_id and q.user_id=(select auth.uid()))));

alter table public.training_lists add column category text not null default 'competitive' check(category in ('competitive','complete-dsa','quick-revision','topic-specific','company-wise'));
alter table public.training_lists add column updated_at timestamptz not null default now();
alter table public.training_lists add column source_url text;
create table public.sheet_collaborators(
 id uuid primary key default gen_random_uuid(),
 sheet_id uuid not null references public.training_lists(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null default 'viewer' check(role in ('viewer','editor')),
 status text not null default 'pending' check(status in ('pending','accepted','declined')),
 invited_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),unique(sheet_id,user_id)
);
create table public.sheet_follows(
 id uuid primary key default gen_random_uuid(),
 sheet_id uuid not null references public.training_lists(id) on delete cascade,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),unique(sheet_id,user_id)
);
alter table public.sheet_collaborators enable row level security;
alter table public.sheet_follows enable row level security;
revoke all on public.sheet_collaborators,public.sheet_follows from public,anon,authenticated;
grant select on public.sheet_collaborators to authenticated;
grant select,insert,delete on public.sheet_follows to authenticated;
grant all on public.sheet_collaborators,public.sheet_follows to service_role;

create function public.can_read_sheet(p_sheet uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.training_lists l where l.id=p_sheet and (
 l.visibility='public' or l.created_by=auth.uid() or
 exists(select 1 from public.sheet_collaborators c where c.sheet_id=l.id and c.user_id=auth.uid() and c.status='accepted') or
 l.visibility='college' and exists(select 1 from public.profiles owner_profile join public.profiles viewer_profile on owner_profile.college_id=viewer_profile.college_id where owner_profile.id=l.created_by and viewer_profile.id=auth.uid() and owner_profile.college_id is not null)
 ));
$$;
create function public.can_edit_sheet(p_sheet uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.training_lists l where l.id=p_sheet and l.created_by=auth.uid()) or exists(select 1 from public.sheet_collaborators c where c.sheet_id=p_sheet and c.user_id=auth.uid() and c.role='editor' and c.status='accepted');
$$;
revoke all on function public.can_read_sheet(uuid),public.can_edit_sheet(uuid) from public,anon;
grant execute on function public.can_read_sheet(uuid),public.can_edit_sheet(uuid) to authenticated;
drop policy public_training_lists_read on public.training_lists;
drop policy public_training_items_read on public.training_items;
create policy readable_sheets on public.training_lists for select to authenticated using(created_by=(select auth.uid()) or visibility='public' or public.can_read_sheet(id));
create policy own_sheet_insert on public.training_lists for insert to authenticated with check(created_by=(select auth.uid()) and (visibility<>'college' or exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.college_id is not null)));
create policy own_sheet_update on public.training_lists for update to authenticated using(created_by=(select auth.uid())) with check(created_by=(select auth.uid()));
create policy own_sheet_delete on public.training_lists for delete to authenticated using(created_by=(select auth.uid()));
grant insert(title,description,visibility,created_by,category,source_url),update(title,description,visibility,category,updated_at,source_url),delete on public.training_lists to authenticated;
create policy readable_sheet_items on public.training_items for select to authenticated using(public.can_read_sheet(training_list_id));
create policy editable_sheet_items on public.training_items for all to authenticated using(public.can_edit_sheet(training_list_id)) with check(public.can_edit_sheet(training_list_id));
grant insert,update,delete on public.training_items to authenticated;
create policy own_sheet_follows on public.sheet_follows for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and public.can_read_sheet(sheet_id));
create policy own_sheet_invites on public.sheet_collaborators for select to authenticated using(user_id=(select auth.uid()) or invited_by=(select auth.uid()));

create function public.invite_sheet_member(p_sheet uuid,p_username text,p_role text default 'viewer') returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_target uuid; v_id uuid;
begin
 if auth.uid() is null or not exists(select 1 from public.training_lists where id=p_sheet and created_by=auth.uid()) then raise exception 'Only the sheet owner can invite members'; end if;
 if p_role not in ('viewer','editor') then raise exception 'Choose a valid collaboration role'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||'sheet-invite',0));
 if (select count(*) from public.sheet_collaborators where invited_by=auth.uid() and created_at>now()-interval '1 hour')>=20 then raise exception 'Too many invitations; retry in an hour'; end if;
 select id into v_target from public.profiles where lower(username)=lower(trim(p_username));
 if v_target is null or v_target=auth.uid() then raise exception 'Enter another member''s AlgoGym username'; end if;
 insert into public.sheet_collaborators(sheet_id,user_id,role,invited_by) values(p_sheet,v_target,p_role,auth.uid())
 on conflict(sheet_id,user_id) do update set role=excluded.role,status='pending',created_at=now() returning id into v_id;
 return v_id;
end; $$;
create function public.respond_sheet_invitation(p_invite uuid,p_accept boolean) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 update public.sheet_collaborators set status=case when p_accept then 'accepted' else 'declined' end where id=p_invite and user_id=auth.uid() and status='pending';
 if not found then raise exception 'This invitation is unavailable or already answered'; end if;
end; $$;
create function public.pending_sheet_invitations() returns table(id uuid,sheet_id uuid,title text,role text) language sql stable security definer set search_path=public,pg_temp as $$
 select c.id,c.sheet_id,l.title,c.role from public.sheet_collaborators c join public.training_lists l on l.id=c.sheet_id where c.user_id=auth.uid() and c.status='pending';
$$;
create function public.sheet_follower_counts(p_sheets uuid[]) returns table(sheet_id uuid,followers bigint) language sql stable security definer set search_path=public,pg_temp as $$
 select l.id,count(f.id) from public.training_lists l left join public.sheet_follows f on f.sheet_id=l.id where l.id=any(p_sheets) and array_length(p_sheets,1)<=200 and public.can_read_sheet(l.id) group by l.id;
$$;
create function public.add_sheet_problem(p_sheet uuid,p_problem uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if not public.can_edit_sheet(p_sheet) then raise exception 'This sheet is not editable by your account'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_sheet::text,0));
 if (select count(*) from public.training_items where training_list_id=p_sheet)>=2000 then raise exception 'A sheet supports up to 2000 problems'; end if;
 insert into public.training_items(training_list_id,problem_id,position) select p_sheet,p_problem,coalesce(max(position)+1,0) from public.training_items where training_list_id=p_sheet on conflict(training_list_id,problem_id) do nothing;
end; $$;
revoke all on function public.invite_sheet_member(uuid,text,text),public.respond_sheet_invitation(uuid,boolean),public.pending_sheet_invitations(),public.sheet_follower_counts(uuid[]),public.add_sheet_problem(uuid,uuid) from public,anon;
grant execute on function public.invite_sheet_member(uuid,text,text),public.respond_sheet_invitation(uuid,boolean),public.pending_sheet_invitations(),public.sheet_follower_counts(uuid[]),public.add_sheet_problem(uuid,uuid) to authenticated;
