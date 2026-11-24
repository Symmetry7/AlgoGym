# Algogym — Build Guide

**Version:** 1.1 · **Date:** 24 Nov 2026 · **Status:** Draft for approval

Built from the [PRD §12 timeline](./PRD.md#12-timeline). Specs: [PRD](./PRD.md) · [System architecture](./SYSTEM_ARCHITECTURE.md) · [Design](./DESIGN.md) · [Decisions](./DECISIONS.md).

## How we work
- One milestone at a time. Each one fits in 1–3 focused sessions.
- After each milestone: show what changed and how to test it, commit (`feat: …` / `chore: …`), then **wait for approval** before the next.
- Every milestone also has to pass these checks: `npm run typecheck`, `npm run lint` (from M1), `npm test`, `npm run build`, and a look at 375 px and 1440 px.
- UI milestones also pass the Impeccable gate (DESIGN.md §9).
- Never commit `.env*` files or secrets. Migrations are additive, in `supabase/migrations/`, and tested on a staging or branch database before production.
- From M3 on, app paths such as `src/…` are relative to `apps/web/`.

## Week 1 — Foundations

### M1 · Design tokens, fonts, app shell, lint + CI (2–3 sessions)
**Goal:** the new black + emerald system exists and every new page can sit inside a real shell.
**Files:**
- `src/styles/tokens.css`: DESIGN.md §2 tokens as CSS variables.
- `tailwind.config.ts`: map the tokens to Tailwind theme colours, radius and spacing.
- `src/app/layout.tsx`: load Instrument Serif, Geist and Geist Mono through `next/font/google`.
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

### M2 · Legacy freeze (1–2 sessions)
**Goal:** old features leave the product without losing user data.
**Files:**
- `src/app/**`: remove or redirect routes for Training Gym, Symm AI, societies, contests, sheets, upsolve, statistics, onboarding and leaderboards.
- `src/proxy.ts`: strip the onboarding redirect.
- The `server/` handlers those routes used, plus the old landing and brand components and their now-unused dependencies.
- `vercel.json`: drop the provider sync cron.

**Done when:**
- [ ] Old URLs redirect to `/roadmap` or `/problems`, with no 500s. Existing users can still sign in.
- [ ] No database tables are dropped. The archive move happens in M6.
- [ ] Interview Prep code and data are untouched.

### M3 · Monorepo move to `apps/web` (1 session)
**Goal:** npm workspaces with the Next.js app in `apps/web`, before any new pages are built, so later milestones never have to move files.
**Files:**
- Root `package.json`: `"workspaces": ["apps/*", "packages/*"]`.
- `apps/web/`: `src/`, `server/`, `public/`, the Next, Tailwind, TypeScript, PostCSS and Vitest configs, and `next-env.d.ts`.
- These stay at the root: `supabase/`, `scripts/`, `data/`, `docs/`, `.github/`.
- `apps/web/package.json` gets the app's dependencies. There is one root `package-lock.json`.
- Update CI paths, the Vercel project's Root Directory (`apps/web`), and the paths scripts use to import app code.

**Done when:**
- [ ] `npm ci` at the root works. `npm run dev`, `typecheck`, `lint`, `test` and `build` work from the root, through workspace scripts.
- [ ] A Vercel preview deploy builds from `apps/web` and env vars resolve. Local `.env.local` works from its new location, documented in the README.
- [ ] `supabase migration list --linked` still works from the root.
- [ ] Routes and behaviour are unchanged (spot-check sign-in, `/pricing`, `/interview-preparations`).

## Week 2 — Public site and content foundations

### M4 · Landing page (2–3 sessions)
**Goal:** the Resend-style landing page from PRD §7.1 and DESIGN.md §6.1.
**Files:** `src/app/page.tsx` and `src/components/landing/*` (one file per section). Hero media: `public/media/cube.{webm,mp4}` and `cube-poster.webp`, either a placeholder poster until the render exists or the poster alone. Brand icons go through the icon build script, which writes `public/icons` and `iconMap.ts`.
**Done when:**
- [ ] All 12 sections are in order. Testimonials stay hidden.
- [ ] Mid-range Android over 4G gets LCP < 2.5 s (Lighthouse mobile). Reduced motion shows the poster.
- [ ] No fake numbers. Live stats come from the database or are left out.
- [ ] Impeccable gate passes.

### M5 · Pricing page (1–2 sessions)
**Goal:** `/pricing` per PRD §7.1 and DESIGN.md §6.2, reusing the existing Razorpay plan data.
**Files:** `src/screens/Pricing.tsx` (rewrite), `src/components/billing/PlanChoice.tsx`, `server/billing.ts` (prices only).
**Done when:**
- [ ] The learner/interviewer toggle and the monthly/yearly switch work. "Save 37%" is correct.
- [ ] The Rooms tab shows "Launching soon" with a waitlist. The FAQ accordion works with the keyboard.

### M6 · Content schema and legacy archive (2 sessions)
**Goal:** the v1.0 tables in SYSTEM_ARCHITECTURE.md §5 exist, with RLS.
**Files:** new migrations in `supabase/migrations/` covering: tracks, roadmap_layers, topics, quiz_questions, problems (new columns or a new table, reconciled with the existing `problems`), problem_languages, test_cases, hints, editorials, patterns and tags, companies and problem_companies, submissions, user_problem_status, user_topic_progress, notes, bookmarks, lists, daily_problems, study_plans, interview_items, entitlements and waitlist. Also a migration that moves legacy tables to `legacy.*`, and generated types in `packages/db`.
**Done when:**
- [ ] Applied cleanly on a staging or branch database, with a row-count check before and after for the legacy tables.
- [ ] RLS is in place: hidden `test_cases` and `harness_code` are service-role only, `submissions` is owner-only `SELECT`, and gated tables check entitlements.
- [ ] Vitest or SQL tests prove a user can't read hidden tests or another user's submission.

### M7 · Interview Prep migration (1–2 sessions)
**Goal:** the existing HR/SQL content lives in `interview_items` and renders in the new UI at `/interview`.
**Done when:**
- [ ] Item counts match the source tables. Filters by company and role work.
- [ ] The old interview URLs redirect.

### M8 · Company metadata import (1 session)
**Goal:** `scripts/data/import-companies.mjs` imports the company-wise CSVs as metadata only (problems with status `pending`).
**Done when:**
- [ ] The import is idempotent: a second run changes nothing. Top 30 companies are present.
- [ ] No statement text is stored for LeetCode/GFG rows.

## Week 3 — Practice surfaces

### M9 · Problems list (2 sessions)
**Goal:** `/problems` per PRD §7.5 and DESIGN.md §6.5.
**Done when:**
- [ ] Search, filters, sort, pagination and shuffle work.
- [ ] Metadata rows show "View original" and "Similar Algogym problem". Original rows open the workspace.
- [ ] Mobile is a single column with drawers.

### M10 · Workspace UI (2–3 sessions)
**Goal:** `/problems/[slug]` per PRD §7.6 and DESIGN.md §6.6, with no judge yet. Run returns a stub.
**Files:** `@monaco-editor/react` (lazy-loaded), the split-pane component, the tabs, and draft autosave.
**Done when:**
- [ ] The panes resize and collapse. All 4 languages load their starter code.
- [ ] The locked state renders. Mobile uses "Problem · Code · Result" tabs.
- [ ] Monaco isn't part of the first-load bundle of other pages.

### M11 · Engine skeleton (1–2 sessions)
**Goal:** `apps/engine`, an Express service with HMAC-verified `POST /v1/jobs`, BullMQ on Redis and `/v1/health`, deployed to Railway.
**Done when:**
- [ ] A forged or expired HMAC gets 401. The job lands in the queue. The health check is green on Railway.
- [ ] The engine builds and tests from the root workspace scripts.

## Week 4 — Judge end to end

### M12 · Harness + Run/Submit (3 sessions)
**Goal:** the judge flow in SYSTEM_ARCHITECTURE.md §4.1–4.2 works end to end.
**Files:**
- `packages/judge`: interface, Judge0 adapter, harnesses for 4 languages, output parser, comparators.
- `/api/judge`, the engine worker, the Realtime subscription, the polling fallback, and the rate limits.
- A content validator that runs each problem's reference solution in all 4 languages.

**Done when:**
- [ ] One Judge0 call per Run and per Submit (verified in logs).
- [ ] An infinite loop yields TLE for that case and `not_run` for the rest. Earlier results are kept.
- [ ] Results for hidden cases contain only case, verdict and runtime (there's a test for this). User prints can't forge results.
- [ ] Rate limits return a clear message. A Judge0 outage keeps the user's code.

### M13 · Companies pages (1–2 sessions)
**Goal:** `/companies` and `/companies/[slug]` per PRD §7.7. Timeframe tabs are gated on the server.
**Done when:**
- [ ] Free users can't fetch 30/60/90-day data through the API or RLS, not just the UI.

## Week 5 — Learning loop

### M14 · Roadmap page (2 sessions)
**Goal:** `/roadmap/[track]` per PRD §7.3 and DESIGN.md §6.3, with node states from `user_topic_progress`.
**Done when:**
- [ ] Node states (not started, lesson read, complete) come from the database. Selecting a node updates the side panel. On mobile the panel is a bottom sheet.

### M15 · Learn lessons (2–3 sessions)
**Goal:** MDX lessons in `content/learn/`, the lesson layout, the step-through visual component, the quiz and the progress API.
**Done when:**
- [ ] Lessons are server-rendered and readable signed out. Progress saves after sign-in. A topic completes per the PRD §7.4 rule.

### M16 · Study plans, My Prep, notes, bookmarks, lists, daily (2–3 sessions)
**Goal:** PRD §7.9.
**Done when:**
- [ ] A user can follow a study plan, see progress and streak in My Prep, and add and remove notes, bookmarks and list items. All of it is owner-only under RLS.

## Week 6 — Monetization and launch

### M17 · Student Pro (2 sessions)
**Goal:** Razorpay checkout, a signed and idempotent webhook, `entitlements`, the `can()` helper, and all gates switched on.
**Done when:**
- [ ] A test-mode payment unlocks content within a minute. Replaying the same webhook event doesn't change anything.

### M18 · Arena waitlist, Credits, legal pages (1 session)
**Goal:** `/arena` (DESIGN.md §6.8), `/credits` with licences, Terms and Privacy.
**Done when:**
- [ ] Waitlist signups are stored, and a duplicate signup doesn't create a second row. Credits lists every source and icon licence.

### M19 · Launch QA (2 sessions)
**Done when:**
- [ ] Launch gate: 60 problems pass in all 4 languages, and Pro checkout works end to end in production.
- [ ] The Impeccable detector is clean on all of `src/`, the accessibility pass is done, and Sentry and PostHog events are firing.

## v1.1 — Rooms (weeks 7–10)

### M20+ · Rooms
Orgs and seats, the hidden room pool, invites, the locked-down candidate workspace, reports with a plagiarism flag, and plan limits (PRD §7.12, SYSTEM_ARCHITECTURE.md §4.6). Split into milestones when v1.0 ships.
