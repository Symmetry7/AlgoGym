-- Every account receives a stable profile URL. Existing visibility choices remain intact.
update public.profiles
set username = 'user_' || substr(replace(id::text, '-', ''), 1, 24)
where username is null;

alter table public.profiles alter column is_public set default true;

create or replace function public.bootstrap_algogym_profile()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.profiles (id, display_name, avatar_url, username, is_public)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    'user_' || substr(replace(new.id::text, '-', ''), 1, 24),
    true
  ) on conflict (id) do nothing;
  return new;
end;
$$;
