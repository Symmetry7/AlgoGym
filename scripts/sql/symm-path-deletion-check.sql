select
  a.attnotnull as module_id_required,
  c.confdeltype as on_module_delete,
  count(*) filter (where ma.module_id is null) as preserved_awards_after_path_deletion
from pg_attribute a
join pg_class t on t.oid = a.attrelid
join pg_namespace n on n.oid = t.relnamespace
join pg_constraint c on c.conrelid = t.oid and c.conname = 'ai_module_awards_module_id_fkey'
left join public.ai_module_awards ma on true
where n.nspname = 'public' and t.relname = 'ai_module_awards' and a.attname = 'module_id'
group by a.attnotnull, c.confdeltype;
