-- Removing a learning path must preserve the historical Chakra award and
-- the unique solve claim that prevents earning another module bonus from it.
alter table public.ai_module_awards
  drop constraint ai_module_awards_module_id_fkey;
alter table public.ai_module_awards
  alter column module_id drop not null;
alter table public.ai_module_awards
  add constraint ai_module_awards_module_id_fkey
  foreign key (module_id) references public.ai_learning_modules(id) on delete set null;

comment on column public.ai_module_awards.module_id is
  'Nullable only after a learning path is deleted; the award and solve uniqueness remain permanent.';
