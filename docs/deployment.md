# Deployment

The app lives in the npm workspace `apps/web`. Each Vercel project uses **Root Directory `apps/web`** (with "Include files outside the root directory" enabled, the default), so Vercel installs from the root `package-lock.json` and builds the app with `apps/web/vercel.json`. Environment variables come from the Vercel project settings; the root `.env*` files are for local development only. There is no cron job. Production serves `release/legacy` until the M20 cutover; `main` deploys previews. CI (`.github/workflows/ci.yml`) runs typecheck, lint, tests, build and the design check on every PR.

## Release checklist

1. From the repo root: `npm ci`, then `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` (or rely on CI).
2. Apply only unapplied, reviewed migrations to the target Supabase project. Preserve existing data and check the migration ledger first.
3. Configure `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_ORIGIN`, and `CRON_SECRET` as Vercel environment variables. Add `GEMINI_API_KEY` for Symm AI; `GEMINI_MODEL` is optional.
4. Configure the Supabase Google provider and allow the production `/api/auth/callback` redirect. Match `APP_ORIGIN` to the actual HTTPS origin.
5. Deploy, inspect Vercel build/function logs, verify public routes, then verify authenticated flows with an authorized test account. Check cron invocation and database job state. Do not run destructive test fixtures against real users.

If the site is blank, first inspect the deployment status and client console, then the Next.js build and runtime logs. If sign-in loops, verify origin, OAuth redirect URLs, cookies, and Supabase configuration. If Symm AI stalls, inspect `ai_generation_jobs`, Gemini configuration, and cron recovery. If provider data is stale, inspect `sync_jobs`, provider response status, and the cron secret. Vercel environment configuration does not prove a migration was applied; check both independently.

The scheduler processes a bounded number of jobs inside a serverless invocation. Rate limits and function duration can defer work to later requests/cron. A dedicated worker and more frequent scheduler are potential scaling changes, not current deployment components.
