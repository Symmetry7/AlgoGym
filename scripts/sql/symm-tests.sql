do $$ begin
  if not exists(select 1 from pg_tables where schemaname='public' and tablename='ai_learning_paths' and rowsecurity) then raise exception 'paths RLS missing'; end if;
  if not exists(select 1 from pg_tables where schemaname='public' and tablename='ai_learning_conversations' and rowsecurity) then raise exception 'conversations RLS missing'; end if;
  if has_table_privilege('authenticated','public.ai_learning_paths','INSERT') then raise exception 'client can insert paths'; end if;
  if has_table_privilege('authenticated','public.ai_learning_progress','INSERT') then raise exception 'client can mark lessons complete'; end if;
  if has_table_privilege('anon','public.ai_learning_paths','SELECT') then raise exception 'anon can read paths'; end if;
  if not has_function_privilege('authenticated','public.reserve_symm_generation(text)','EXECUTE') then raise exception 'quota unavailable'; end if;
end $$;
