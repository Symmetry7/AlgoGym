select jsonb_build_object(
  'tables', (select jsonb_agg(jsonb_build_object('name',tablename,'rls',rowsecurity)) from pg_tables where schemaname='public'),
  'user_count', (select count(*) from auth.users),
  'verified_profiles', (select count(*) from public.coding_profiles),
  'legacy_onboarded', (select count(*) from public.app_profiles where onboarding_completed_at is not null),
  'policies', (select jsonb_agg(jsonb_build_object('table',tablename,'name',policyname,'roles',roles,'command',cmd)) from pg_policies where schemaname='public'),
  'migrations', (select jsonb_agg(jsonb_build_object('version',version,'name',name)) from supabase_migrations.schema_migrations)
) as audit;
