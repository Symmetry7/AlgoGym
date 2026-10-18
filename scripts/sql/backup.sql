-- Read-only snapshot. Output contains private records; save only in ignored .local-backups/.
select jsonb_build_object(
  'captured_at', now(),
  'project_ref', 'sfnmcgcxerbqceujzbqv',
  'coding_profiles', (select coalesce(jsonb_agg(t),'[]') from public.coding_profiles t),
  'profile_verification_challenges', (select coalesce(jsonb_agg(t),'[]') from public.profile_verification_challenges t),
  'profile_verification_events', (select coalesce(jsonb_agg(t),'[]') from public.profile_verification_events t),
  'app_profiles', (select coalesce(jsonb_agg(t),'[]') from public.app_profiles t),
  'columns', (select jsonb_agg(t) from (select table_name,column_name,data_type,is_nullable,column_default from information_schema.columns where table_schema='public') t),
  'constraints', (select jsonb_agg(jsonb_build_object('table',conrelid::regclass::text,'name',conname,'definition',pg_get_constraintdef(oid))) from pg_constraint where connamespace='public'::regnamespace),
  'policies', (select jsonb_agg(t) from pg_policies t where schemaname='public'),
  'user_count', (select count(*) from auth.users)
) as backup;
