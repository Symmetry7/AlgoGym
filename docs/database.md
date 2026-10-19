# Database

Supabase PostgreSQL is the source of truth. The ordered files in `supabase/migrations/` define schema, constraints, RLS policies, and RPCs. Keep historical migrations intact; add new migrations for changes. Do not infer that a local file has already been applied to a particular deployed project.

| Domain | Principal tables |
| --- | --- |
| Identity and college | `profiles`, `coding_profiles`, `colleges`, `college_aliases`, `college_requests` |
| Community | `societies`, `memberships`, `society_applications`, `society_invites` |
| Practice and sync | `problems`, `training_lists`, `training_items`, `provider_sync_runs`, `provider_snapshots`, `provider_submissions`, `provider_rating_history`, `sync_jobs`, `solves` |
| Rewards and ranking | `chakra_policies`, `chakra_awards`, `chakra_ledger`, `chakra_balance_cache`, `ai_module_awards`, `leaderboard_snapshots`, `leaderboard_entries` |
| Learning | `ai_learning_paths`, `ai_learning_modules`, `ai_learning_lessons`, `ai_learning_progress`, `ai_learning_conversations`, `ai_lesson_code_variants`, `ai_generation_jobs`, `ai_recommended_problems`, `ai_content_reports` |
| Workspace | `study_notes`, `workspace_questions`, `sheet_collaborators`, `sheet_follows` |

`auth.users` owns identity; dependent domain rows reference that UUID. Paths own modules, modules own lessons and recommendations, and progress is scoped to a user and lesson. Problems connect provider submissions and solves. Reward rows reference verified solves and are protected by unique constraints. Active competitive membership has a partial unique index.

RLS is enabled in the migrations for private application records. Read policies usually compare `user_id` with `auth.uid()` or follow the parent path's owner. Privileged server handlers use the service-role key only after authenticating and checking ownership. Security-definer functions explicitly set `search_path` and implement critical transactional operations such as sync and reward claims. Review each migration for the precise policy; not all tables share one generic access rule.

Indexes support owner/recent learning-path reads, ordered module/lesson reads, runnable sync jobs, provider identity, and leaderboard lookups. Keep query shape and index changes together. To set up a linked **development** project, configure the Supabase CLI and run `supabase db push`; verify migration status before applying anything to production. Never reset an existing production database for local testing.

See [architecture](architecture.md) for the relationship diagram and [Chakra](chakra.md) for award integrity.
