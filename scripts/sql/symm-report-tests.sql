do $$ begin
  if not exists(select 1 from pg_tables where schemaname='public' and tablename='ai_content_reports' and rowsecurity) then raise exception 'content report RLS missing'; end if;
  if has_table_privilege('authenticated','public.ai_content_reports','INSERT') then raise exception 'client can forge reports'; end if;
  if has_table_privilege('anon','public.ai_content_reports','SELECT') then raise exception 'anon can read reports'; end if;
end $$;
