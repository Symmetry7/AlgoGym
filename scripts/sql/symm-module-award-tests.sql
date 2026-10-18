do $$ begin
  if not exists(select 1 from pg_tables where schemaname='public' and tablename='ai_module_awards' and rowsecurity) then raise exception 'module awards RLS missing'; end if;
  if has_table_privilege('authenticated','public.ai_module_awards','INSERT') then raise exception 'client can forge module rewards'; end if;
  if has_table_privilege('anon','public.ai_module_awards','SELECT') then raise exception 'anon can read awards'; end if;
  if not has_function_privilege('authenticated','public.claim_symm_module_award(uuid)','EXECUTE') then raise exception 'claim function unavailable'; end if;
end $$;
