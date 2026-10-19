# Deployment

`vercel.json` selects the Next.js framework, runs `npm run build`, and schedules `GET /api/jobs/sync` once daily. The route requires `Authorization: Bearer <CRON_SECRET>`. Next.js builds use the npm lockfile and the project's environment variables. The current repository has no separate CI workflow or dedicated worker deployment.

## Release checklist

1. Install with `npm ci`; run `npm run typecheck`, `npm test`, and `npm run build` locally or in an isolated CI environment. No lint script is currently configured.
2. Apply only unapplied, reviewed migrations to the target Supabase project. Preserve existing data and check the migration ledger first.
3. Configure `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_ORIGIN`, and `CRON_SECRET` as Vercel environment variables. Add `GEMINI_API_KEY` for Symm AI; `GEMINI_MODEL` is optional.
4. Configure the Supabase Google provider and allow the production `/api/auth/callback` redirect. Match `APP_ORIGIN` to the actual HTTPS origin.
5. Deploy, inspect Vercel build/function logs, verify public routes, then verify authenticated flows with an authorized test account. Check cron invocation and database job state. Do not run destructive test fixtures against real users.

If the site is blank, first inspect the deployment status and client console, then the Next.js build and runtime logs. If sign-in loops, verify origin, OAuth redirect URLs, cookies, and Supabase configuration. If Symm AI stalls, inspect `ai_generation_jobs`, Gemini configuration, and cron recovery. If provider data is stale, inspect `sync_jobs`, provider response status, and the cron secret. Vercel environment configuration does not prove a migration was applied; check both independently.

The scheduler processes a bounded number of jobs inside a serverless invocation. Rate limits and function duration can defer work to later requests/cron. A dedicated worker and more frequent scheduler are potential scaling changes, not current deployment components.
