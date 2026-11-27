# Algogym — Build Guide

**Version:** 1.2 · **Date:** 24 Nov 2026 · **Status:** Draft for approval

Built from the [PRD §12 timeline](./PRD.md#12-timeline). Specs: [PRD](./PRD.md) · [System architecture](./SYSTEM_ARCHITECTURE.md) · [Design](./DESIGN.md) · [Decisions](./DECISIONS.md).

## How we work
- One milestone at a time. Each one fits in 1–3 focused sessions.
- After each milestone: show what changed and how to test it, commit (`feat: …` / `chore: …`), then **wait for approval** before the next.
- Every milestone also has to pass these checks: `npm run typecheck`, `npm run lint` (from M1), `npm test`, `npm run build`, and a look at 375 px and 1440 px.
- UI milestones also pass the Impeccable gate (DESIGN.md §9).
- Never commit `.env*` files or secrets. Migrations live in `supabase/migrations/` and are tested on a staging or branch database before production.
- **Release model until launch:** production serves the legacy app from `release/legacy` (Vercel's Production Branch). Each milestone merges to `main` as soon as it's done, and `main` deploys previews only. At launch (M20) the Production Branch switches back to `main`.
- **Additive-only migrations until launch:** the legacy app shares the database. No table or column is renamed, moved, dropped or made stricter until the M20 cutover.
- From M3 on, app paths such as `src/…` are relative to `apps/web/`.
- Two tracks run in parallel. **Engineering** (M1–M20) follows the order below. **Content** (C1–C6) delivers one batch per week, using the authoring template and pipeline.

## Overview

| Week | Engineering | Content |
| --- | --- | --- |
| 1 | M1 Tokens + shell + lint/CI · M2 Legacy freeze · M3 Monorepo move | C1 Authoring template + first 10 problems |
| 2 | M4 Content schema · M5 Problem authoring pipeline · M6 Interview Prep migration · M7 Company import | C2 20 problems, 4 lessons, top-30 company list |
| 3 | M8 Problems list · M9 Workspace UI · M10 Engine skeleton | C3 35 problems, 8 lessons |
| 4 | M11 Harness + Run/Submit · M12 Companies pages | C4 45 problems, 12 lessons |
| 5 | M13 Roadmap · M14 Learn · M15 Study plans + My Prep · M16 Landing | C5 55 problems, all DSA + pattern lessons |
| 6 | M17 Pricing · M18 Student Pro · M19 Arena waitlist, Credits, legal · M20 Launch QA + cutover | C6 60 problems reviewed in 4 languages |
| 7–10 | M21+ Rooms (v1.1) | Hidden room-only pool |

Judge Run/Submit lands by the end of week 4 (M11). Landing and Pricing come after Roadmap, Learn and My Prep, so their previews show real screens.

---

## Engineering track

### Week 1 — Foundations

#### M1 · Design tokens, fonts, app shell, lint + CI (2–3 sessions)
**Goal:** the new black + emerald system exists and every new page can sit inside a real shell.
**Files:**
- `src/styles/tokens.css`: DESIGN.md §2 tokens as CSS variables.
- `tailwind.config.ts`: map the tokens to Tailwind theme colours, radius and spacing.
- `src/app/layout.tsx`: load Instrument Serif, Hanken Grotesk and Geist Mono through `next/font/google`.
- `src/components/shell/`: `MarketingNav`, `AppShell` (top nav: Roadmap, Problems, Companies, Interview, Arena *Soon*, Pricing), `Footer`, plus button, card and segmented-tab primitives (DESIGN.md §5).
- `eslint.config.mjs`: flat config with `eslint-config-next`. Next 16 has no `next lint`, so the script runs `eslint .`.
- `package.json` scripts: `lint`.
- `.github/workflows/ci.yml`: typecheck, lint, test, build, and `npx impeccable detect` on the new UI paths.

**Done when:**
- [ ] Tokens and fonts render on a `/_design` preview page (noindex) showing buttons, cards, tabs, chips and type scale.
- [ ] Shell works from 375 px (nav collapses to a menu), is keyboard reachable, and shows a visible emerald focus ring.
- [ ] Text contrast is AA. `--on-accent` is used on emerald buttons.
- [ ] `npm run lint` exists and passes. CI runs green on a PR.
- [ ] Impeccable detector is clean on the new paths. `/audit` has no high-severity items.

#### M2 · Legacy freeze (1–2 sessions)
**Goal:** old features leave `main` without losing user data. Production keeps serving them from `release/legacy` until launch.
**Files:**
- `src/app/**`: remove the routes for Training Gym (`/training`, `/train`, `/upsolve`, `/sheets`, `/resources`), Symm AI (`/training/symm/*`), societies and contests (`/societies/*`, `/contests`, `/admin`), `/statistics`, `/leaderboards`, `/onboarding`, `/dashboard`, `/workspace`, `/notes`, and profiles (`/profile`, `/profile/card`, `/u/[username]`). Each old URL redirects to `/problems`.
- `src/components/auth/AuthGate.tsx`: strip the onboarding redirect (it lives here, not in `proxy.ts`). Sign-in lands on `/problems` instead of `/dashboard`.
- `/settings` stays, without the coding-platform connections.
- `/`: a holding page built from the M1 shell (headline, one paragraph, Problems / Interview prep / Sign in). No made-up numbers. The real landing page is M16.
- The `server/` handlers only removed routes used (Symm AI, societies and contests, statistics, leaderboards, profile verification, public profiles, colleges, the sync cron), the old landing and brand components, and their now-unused dependencies (check peer dependencies of what stays before removing a package). Legacy endpoints that surviving pages still call stay until their replacements: account state (`/api/onboarding` GET), the `/problems` catalog and detail (`providers`, `problem`, `tracker`, `sync`, `study`, until M8/M9) and `/pricing`'s `coin-exchange` (M17).
- `vercel.json`: drop the `/api/jobs/sync` cron (provider sync and Symm jobs).

**Done when:**
- [ ] Every removed URL redirects to `/problems`, with no 500s. Existing users can still sign in.
- [ ] No migration, no dropped table. Legacy tables are archived at the launch cutover (M20).
- [ ] Interview Prep, billing, `/pricing`, `/privacy` and `/problems` are untouched.

#### M3 · Monorepo move to `apps/web` (1 session)
**Goal:** npm workspaces with the Next.js app in `apps/web`, before any new pages are built, so later milestones never have to move files.
**Files:**
- Root `package.json`: `"workspaces": ["apps/*", "packages/*"]`.
- `apps/web/`: `src/`, `server/`, `public/`, the Next, Tailwind, TypeScript, PostCSS and Vitest configs, and `next-env.d.ts`.
- These stay at the root: `supabase/`, `scripts/`, `data/`, `content/`, `docs/`, `.github/`.
- `apps/web/package.json` gets the app's dependencies. There is one root `package-lock.json`.
- Update CI paths, the Vercel project's Root Directory (`apps/web`), and the paths scripts use to import app code.

**Done when:**
- [ ] `npm ci` at the root works. `npm run dev`, `typecheck`, `lint`, `test` and `build` work from the root, through workspace scripts.
- [ ] A Vercel preview deploy builds from `apps/web` and env vars resolve. Local `.env.local` works from its new location, documented in the README.
- [ ] `supabase migration list --linked` still works from the root.
- [ ] Routes and behaviour are unchanged (spot-check sign-in, `/pricing`, `/interview-preparations`).

### Week 2 — Data foundations

#### M4 · Content schema (2 sessions)
**Goal:** the v1.0 tables in SYSTEM_ARCHITECTURE.md §5 exist, with RLS, without touching anything the legacy app uses.
**Files:** additive migrations in `supabase/migrations/` covering: tracks, roadmap_layers, topics, quiz_questions, problems (new columns or a new table, reconciled with the existing `problems`), problem_languages, test_cases, hints, editorials, patterns and tags, companies and problem_companies, submissions, user_problem_status, user_topic_progress, notes, bookmarks, lists, daily_problems, study_plans, interview_items, entitlements and waitlist. Generated types in `packages/db`. New names must not collide with legacy tables (e.g. legacy `study_notes` vs new `notes`).
**Done when:**
- [x] Applied cleanly on a staging or branch database. Every statement is additive: no rename, move, drop, or new constraint on an existing table. (Staging `algogym-staging`, 2026-11-26: all 50 earlier migrations replayed without errors, then M4.)
- [x] The legacy app (`release/legacy`) still works against the migrated database: spot-check sign-in, Symm AI, societies and Interview Prep. (Session, account state, Interview Prep, societies, Symm AI and billing APIs all return 200. An interactive Google/email sign-in still needs a person.)
- [x] RLS is in place: hidden `test_cases` and `harness_code` are service-role only, `submissions` is owner-only `SELECT`, and gated tables check entitlements.
- [x] Vitest or SQL tests prove a user can't read hidden tests or another user's submission. (`scripts/sql/rls-v1-content-tests.sql`, run with `node scripts/ops/staging-sql.mjs test …`.)

#### M5 · Problem authoring pipeline (2–3 sessions)
**Goal:** problems are authored as reviewable files, validated automatically and seeded idempotently.
**Files:**
- `content/problems/<slug>/`, one folder per problem:
  - `statement.md`
  - `meta.json` (schema `content/problems/meta.schema.json`): title, difficulty, topics, patterns, typed function `signature`, per-case time limit, `max_total_ms`, memory limit, comparator, `is_pro`, `pool`, and optional `similar_to` (LeetCode/GFG metadata ids).
  - `tests/public/` and `tests/hidden/`: `NN.in` is the JSON argument list, `NN.out` the JSON return value.
  - `solutions/`: `solution.js`, `solution.py`, `solution.cpp`, `Solution.java`.
  - Optional `starter/` and `harness/` overrides per language, only for problems the generator can't express.
- `content/problems/_template/` and `docs/CONTENT_GUIDE.md`: the authoring template and rules (C1).
- `packages/judge`:
  - The judge interface, plus a **local** adapter that compiles and runs trusted reference code on the dev machine or CI runner.
  - **Generators** that build the starter stub and the hidden harness for all 4 languages from `meta.json`'s signature, honouring per-language overrides. Harnesses follow the one-process, JSON-line, `not_run` contract in SYSTEM_ARCHITECTURE.md §4.2, so M11 reuses them unchanged.
- `scripts/data/validate-problems.mjs`: checks that `meta.json` matches its schema, then runs every reference solution against every test through the judge interface, and compiles each generated (or overridden) starter + harness pair.
- `packages/judge/src/gen.mjs` + `scripts/data/generate-tests.mjs`: seeded max-size tests from an optional `tests/gen.mjs` per problem, written as `tests/hidden/gNN.*` with outputs from the JavaScript reference.
- `scripts/data/seed-problems.mjs`: idempotent upsert by slug into problems, problem_languages, test_cases, hints and editorials.
- CI job: the validator, with Node, Python, g++ and a JDK on the runner.

**Done when:**
- [x] The generators produce compiling starters and harnesses for every signature type in the schema (a test per type).
- [x] 3 sample problems validate in all 4 languages. (All 20 C1/C2 problems and the template validate.)
- [x] They seed cleanly, and a second seed run changes nothing. (All 20 seeded to staging with `--include-drafts`: 501 rows, then 0 changes on the second run.)
- [x] The validator runs in CI and fails the build on a broken test or solution.

#### M6 · Interview Prep migration (1–2 sessions)
**Goal:** the existing HR/SQL content lives in `interview_items` and renders in the new UI at `/interview`.
**Done when:**
- [x] Item counts match the source tables. Filters by company and role work. (Staging: 100 HR + 110 SQL, equal to the legacy `hr-questions` and `sql` categories, checked by `scripts/sql/interview-items-tests.sql`. Company and role filters are built and unit-tested, but no legacy HR or SQL row has a company or role, so they stay hidden until items carry those tags.)
- [x] The old interview URLs redirect. (`/interview-preparations/hr-questions` and `/sql` → `/interview?kind=…`, 308. The rest of `/interview-preparations` stays until its content has a new home.)

#### M7 · Company metadata import (1 session)
**Goal:** `scripts/data/import-companies.mjs` imports the company-wise CSVs as metadata only (problems with status `pending`).
**Done when:**
- [x] The import is idempotent: a second run changes nothing. Top 30 companies are present. (Staging: 30 companies, 3,139 LeetCode rows, 14,680 links; second run 0 changes.)
- [x] No statement text is stored for LeetCode/GFG rows. (`scripts/sql/company-import-tests.sql`; the M4 check constraint also enforces it.)

### Week 3 — Practice surfaces

#### M8 · Problems list (2 sessions)
**Goal:** `/problems` per PRD §7.5 and DESIGN.md §6.5.
**Done when:**
- [x] Search, filters, sort, pagination and shuffle work. (Plus status and list filters, the solved ring, company chips, My Lists and the daily calendar; unit-tested in `src/lib/problem-catalog.spec.ts` and checked signed in and signed out on staging.)
- [x] Metadata rows show "View original" and "Similar Algogym problem". Original rows open the workspace. (Until M9 they open a read-only `/problems/[slug]` page with the statement and examples.)
- [x] Mobile is a single column with drawers. (Checked at 375 and 1440 px.)

#### M9 · Workspace UI (2–3 sessions)
**Goal:** `/problems/[slug]` per PRD §7.6 and DESIGN.md §6.6, with no judge yet. Run returns a stub.
**Files:** `@monaco-editor/react` (lazy-loaded), the split-pane component, the tabs, and draft autosave.
**Done when:**
- [x] The panes resize and collapse. All 4 languages load their starter code from the seeded problems.
- [x] The locked state renders. Mobile uses "Problem · Code · Result" tabs.
- [x] Monaco isn't part of the first-load bundle of other pages. (`next/dynamic` with `ssr: false`, Monaco itself from a pinned CDN build.)
- [x] Floating-panel layout per DESIGN.md §6.6: 12 px gaps, 16 px-radius `--surface-1` cards with a 1 px `--border`, no edge-to-edge panes. One floating top bar with back, a breadcrumb (title in Hanken Grotesk, id in Geist Mono) and a language picker with a muted version ("Python 3.12"). Run is an off-white pill with a black play icon, Submit is the emerald primary.
- [x] Ctrl+Enter runs and Ctrl+Shift+Enter submits (⌘ on macOS), from the editor and anywhere on the page.
- [x] Three panels at ≥ 1280 px. Output · Input · Tests dock under the editor at 768–1279 px. Tabs "Problem · Code · Result" below 768 px. Checked at 375, 1024 and 1440 px.
- [x] Editor: a muted Geist Mono file-name label, faint line numbers, a subtle current-line highlight and no minimap. The Output · Input · Tests tabs have Lucide icons, and every empty state says what to do ("Run your code to see output. Ctrl+Enter works too.").
- [x] Monochrome UI: emerald only on Submit, passed cases and focus. No presence avatars or Share (Rooms, v1.1).

#### M10 · Engine skeleton (1–2 sessions)
**Goal:** `apps/engine`, an Express service with HMAC-verified `POST /v1/jobs`, BullMQ on Redis and `/v1/health`.
**Done when:** the code is merged (DECISIONS.md 2026-11-27: no engine deploy for v1.0, nothing on Railway).
- [x] A forged or expired HMAC gets 401. The job lands in the queue (`apps/engine/src/app.spec.ts`).
- [x] The engine builds and tests from the root workspace scripts.

### Week 4 — Judge end to end

#### M11 · Code runner + Run/Submit (3 sessions)
**Goal:** the judge flow in SYSTEM_ARCHITECTURE.md §4.1–4.2 works end to end, with Next.js `/api/judge` calling OnlineCompiler.io directly (no engine, no Railway).
**Files:**
- `packages/judge`: the OnlineCompiler.io adapter (next to the local adapter from M5) and hidden-case fingerprints in the harnesses.
- `/api/judge` (POST) and `/api/judge/[id]` (poll), the Realtime subscription, and the Postgres rate limits (`judge_take_slot`).

**Done when:**
- [ ] Run and Submit work in the workspace for every seeded problem (needs `CODE_RUNNER_KEY`, `docs/ENGINE.md`).
- [ ] One runner call per Run and per Submit (verified in logs).
- [ ] An infinite loop yields TLE for that case and `not_run` for the rest. Earlier results are kept.
- [ ] Results for hidden cases contain only case, verdict and runtime (there's a test for this). User prints can't forge results.
- [ ] Rate limits return a clear message. A runner outage keeps the user's code.
- [ ] The validator passes in `--judge0` mode for all seeded problems.

#### M12 · Companies pages (1–2 sessions)
**Goal:** `/companies` and `/companies/[slug]` per PRD §7.7. Timeframe tabs are gated on the server.
**Done when:**
- [ ] Free users can't fetch 30/60/90-day data through the API or RLS, not just the UI.

### Week 5 — Learning loop and landing

#### M13 · Roadmap page (2 sessions)
**Goal:** `/roadmap/[track]` per PRD §7.3 and DESIGN.md §6.3, with node states from `user_topic_progress`.
**Done when:**
- [ ] Node states (not started, lesson read, complete) come from the database. Selecting a node updates the side panel. On mobile the panel is a bottom sheet.
- [ ] The M2 redirects and the post-sign-in landing switch from `/problems` to `/roadmap`.

#### M14 · Learn lessons (2–3 sessions)
**Goal:** MDX lessons in `content/learn/`, the lesson layout, the step-through visual component, the quiz and the progress API.
**Done when:**
- [ ] Lessons are server-rendered and readable signed out. Progress saves after sign-in. A topic completes per the PRD §7.4 rule.

#### M15 · Study plans, My Prep, notes, bookmarks, lists, daily (2–3 sessions)
**Goal:** PRD §7.9.
**Done when:**
- [ ] A user can follow a study plan, see progress and streak in My Prep, and add and remove notes, bookmarks and list items. All of it is owner-only under RLS.

#### M16 · Landing page (2–3 sessions)
**Goal:** the landing page in DESIGN.md §6.1: elenkus-style sticky copy beside live demos, in the Algogym brand, with the three.js roadmap hero (§3.1). PRD §7.1 sets the content. Demos use the real components from M9–M15 with sample data.
**Files:** `src/app/page.tsx`, `src/components/landing/*` (one file per section) and `src/components/landing/RoadmapScene.tsx` (three.js, dynamically imported). `public/media/roadmap-poster.webp`. `scripts/data/build-icons.mjs` writes `public/icons` and `iconMap.ts`.
**Done when:**
- [ ] All 8 sections are in order. Each "How it works" demo is interactive and uses real components. Copy is original and written with the `design:ux-copy` skill.
- [ ] Hero: the three.js scene loads after first paint within its 150 KB gzip budget and pauses offscreen. The poster shows below 768 px, with reduced motion, with Save-Data and without WebGL, with no layout shift.
- [ ] Mid-range Android over 4G gets LCP < 2.5 s (Lighthouse mobile). Lighthouse mobile performance and accessibility ≥ 90.
- [ ] No fake numbers: live stats come from the database, and research claims are cited or left out.
- [ ] Checked at 375, 768, 1024 and 1440 px with no horizontal scroll. Impeccable gate passes.

### Week 6 — Monetization and launch

#### M17 · Pricing page (1–2 sessions)
**Goal:** `/pricing` per PRD §7.1 and DESIGN.md §6.2, reusing the existing Razorpay plan data.
**Files:** `src/screens/Pricing.tsx` (rewrite), `src/components/billing/PlanChoice.tsx`, `server/billing.ts` (prices only).
**Done when:**
- [ ] The learner/interviewer toggle and the monthly/yearly switch work. "Save 37%" is correct.
- [ ] The Rooms tab shows "Launching soon" with a waitlist. The FAQ accordion works with the keyboard.

#### M18 · Student Pro (2 sessions)
**Goal:** Razorpay checkout, a signed and idempotent webhook, `entitlements`, the `can()` helper, and all gates switched on.
**Done when:**
- [ ] A test-mode payment unlocks content within a minute. Replaying the same webhook event doesn't change anything.

#### M19 · Arena waitlist, Credits, legal pages (1 session)
**Goal:** `/arena` (DESIGN.md §6.8), `/credits` with licences, Terms and Privacy.
**Done when:**
- [ ] Waitlist signups are stored, and a duplicate signup doesn't create a second row. Credits lists every source and icon licence.

#### M20 · Launch QA and cutover (2–3 sessions)
**Goal:** pass the launch gate, then move production from `release/legacy` to `main`.
**Cutover task** (in this order, with a written runbook and a fresh database backup):
1. Backfill `entitlements` from legacy `billing_subscriptions`, so active payers keep access.
2. Point the Razorpay webhook at the new `/api/webhooks/razorpay` handler, and confirm the legacy webhook is no longer called.
3. Migration that moves legacy-only tables to the `legacy` schema (no drops), with row counts recorded before and after. `profiles`, auth users and anything the new app reads stay in `public`.
4. Switch Vercel's Production Branch to `main`. Retire `release/legacy` (keep the branch; stop deploying it).

**Done when:**
- [ ] Launch gate: 60 problems pass in all 4 languages, and Pro checkout works end to end on the production deployment of `main`.
- [ ] The Impeccable detector is clean on all of `src/`, the accessibility pass is done, and Sentry and PostHog events are firing.
- [ ] Cutover rehearsed on a staging copy of the production database first. Row counts match. Every pre-cutover Pro subscriber has an active entitlement.
- [ ] After the switch: existing users sign in, and the old URLs redirect without 500s.

### v1.1 — Rooms (weeks 7–10)

#### M21+ · Rooms
Orgs and seats, the hidden room pool, invites, the locked-down candidate workspace, reports with a plagiarism flag, and plan limits (PRD §7.12, SYSTEM_ARCHITECTURE.md §4.6). Split into milestones when v1.0 ships.

---

## Content track

Every playable problem is an Algogym original (see [DECISIONS.md](./DECISIONS.md)). Problems follow `content/problems/_template/`. Lessons live in `content/learn/<track>/<topic>.mdx`. Each item is reviewed by a second person before it counts. Targets are cumulative.

| # | Week | Target | Done when |
| --- | --- | --- | --- |
| C1 | 1 | Authoring template + style guide; first **10 problems** | Template has every file M5 expects. The 10 problems are drafted and peer-reviewed, and they validate as soon as M5 lands in week 2. |
| C2 | 2 | **20 problems**, **4 lessons**, top-30 company list | 20 problems pass the validator in all 4 languages and are seeded. 4 lessons merged. Company list agreed for M7. |
| C3 | 3 | **35 problems**, **8 lessons** | 35 validated and seeded. 8 lessons merged, each with a quiz. |
| C4 | 4 | **45 problems**, **12 lessons** | 45 validated (hidden cases fingerprinted, as on Submit). 12 lessons merged. |
| C5 | 5 | **55 problems**, all DSA topic lessons + 16 pattern lessons | 55 validated. Every roadmap node in M13 has a lesson. |
| C6 | 6 | **60 problems** reviewed in 4 languages | 60 pass the validator with hidden cases fingerprinted, with second-person review, editorials and hints complete. This is the launch-gate content. |

Rule from the PRD: if content falls behind, launch with fewer problems rather than slip.
