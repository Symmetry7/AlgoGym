# Algogym — Build Guide

**Version:** 1.0 · **Date:** 24 Nov 2026 · **Status:** Draft for approval

Built from the [PRD §12 timeline](./PRD.md#12-timeline). Specs: [PRD](./PRD.md) · [System architecture](./SYSTEM_ARCHITECTURE.md) · [Design](./DESIGN.md) · [Decisions](./DECISIONS.md).

## How we work
- One milestone at a time. Each one fits in 1–3 focused sessions.
- After each milestone: show what changed and how to test it, commit (`feat: …` / `chore: …`), then **wait for approval** before the next.
- Every milestone also has to pass these checks: `npm run typecheck`, `npm run lint` (from M1), `npm test`, `npm run build`, and a look at 375 px and 1440 px.
- UI milestones also pass the Impeccable gate (DESIGN.md §9).
- Never commit `.env*` files or secrets. Migrations are additive, in `supabase/migrations/`, and tested on a staging or branch database before production.

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
- [ ] No database tables are dropped. The archive move happens in M5.
- [ ] Interview Prep code and data are untouched.

## Week 2 — Public site and content foundations

### M3 · Landing page (2–3 sessions)
**Goal:** the Resend-style landing page from PRD §7.1 and DESIGN.md §6.1.
**Files:** `src/app/page.tsx` and `src/components/landing/*` (one file per section). Hero media: `public/media/cube.{webm,mp4}` and `cube-poster.webp`, either a placeholder poster until the render exists or the poster alone. Brand icons go through `scripts/build-icons.ts`, which writes `public/icons` and `iconMap.ts`.
**Done when:**
- [ ] All 12 sections are in order. Testimonials stay hidden.
- [ ] Mid-range Android over 4G gets LCP < 2.5 s (Lighthouse mobile). Reduced motion shows the poster.
- [ ] No fake numbers. Live stats come from the database or are left out.
- [ ] Impeccable gate passes.

### M4 · Pricing page (1–2 sessions)
**Goal:** `/pricing` per PRD §7.1 and DESIGN.md §6.2, reusing the existing Razorpay plan data.
**Files:** `src/screens/Pricing.tsx` (rewrite), `src/components/billing/PlanChoice.tsx`, `server/billing.ts` (prices only).
**Done when:**
- [ ] The learner/interviewer toggle and the monthly/yearly switch work. "Save 37%" is correct.
- [ ] The Rooms tab shows "Launching soon" with a waitlist. The FAQ accordion works with the keyboard.

### M5 · Content schema and legacy archive (2 sessions)
**Goal:** the v1.0 tables in SYSTEM_ARCHITECTURE.md §5 exist, with RLS.
**Files:** new migrations in `supabase/migrations/` covering: tracks, roadmap_layers, topics, quiz_questions, problems (new columns or a new table, reconciled with the existing `problems`), problem_languages, test_cases, hints, editorials, patterns and tags, companies and problem_companies, submissions, user_problem_status, user_topic_progress, notes, bookmarks, lists, daily_problems, study_plans, interview_items, entitlements and waitlist. Also a migration that moves legacy tables to `legacy.*`, and generated types.
**Done when:**
- [ ] Applied cleanly on a staging or branch database, with a row-count check before and after for the legacy tables.
- [ ] RLS is in place: hidden `test_cases` and `harness_code` are service-role only, `submissions` is owner-only `SELECT`, and gated tables check entitlements.
- [ ] Vitest or SQL tests prove a user can't read hidden tests or another user's submission.

### M6 · Interview Prep migration (1–2 sessions)
**Goal:** the existing HR/SQL content lives in `interview_items` and renders in the new UI at `/interview`.
**Done when:**
- [ ] Item counts match the source tables. Filters by company and role work.
- [ ] The old interview URLs redirect.

### M7 · Company metadata import (1 session)
**Goal:** `scripts/data/import-companies.mjs` imports the company-wise CSVs as metadata only (problems with status `pending`).
**Done when:**
- [ ] The import is idempotent: a second run changes nothing. Top 30 companies are present.
- [ ] No statement text is stored for LeetCode/GFG rows.

## Week 3 — Practice surfaces

### M8 · Problems list (2 sessions)
**Goal:** `/problems` per PRD §7.5 and DESIGN.md §6.5.
**Done when:**
- [ ] Search, filters, sort, pagination and shuffle work.
- [ ] Metadata rows show "View original" and "Similar Algogym problem". Original rows open the workspace.
- [ ] Mobile is a single column with drawers.

### M9 · Workspace UI (2–3 sessions)
**Goal:** `/problems/[slug]` per PRD §7.6 and DESIGN.md §6.6, with no judge yet. Run returns a stub.
**Files:** `@monaco-editor/react` (lazy-loaded), the split-pane component, the tabs, and draft autosave.
**Done when:**
- [ ] The panes resize and collapse. All 4 languages load their starter code.
- [ ] The locked state renders. Mobile uses "Problem · Code · Result" tabs.
- [ ] Monaco isn't part of the first-load bundle of other pages.

### M10 · Workspaces and engine skeleton (2 sessions)
**Goal:** npm workspaces with `apps/web` and `apps/engine`, plus an Express engine with HMAC-verified `POST /v1/jobs`, BullMQ and `/v1/health`, deployed to Railway.
**Done when:**
- [ ] `supabase/` is still at the repo root. Vercel builds `apps/web`.
- [ ] A forged or expired HMAC gets 401. The job lands in the queue. The health check is green on Railway.

## Week 4 — Judge end to end

### M11 · Harness + Run/Submit (3 sessions)
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

### M12 · Companies pages (1–2 sessions)
**Goal:** `/companies` and `/companies/[slug]` per PRD §7.7. Timeframe tabs are gated on the server.
**Done when:**
- [ ] Free users can't fetch 30/60/90-day data through the API or RLS, not just the UI.

## Week 5 — Learning loop

### M13 · Roadmap page (2 sessions)
**Goal:** `/roadmap/[track]` per PRD §7.3 and DESIGN.md §6.3, with node states from `user_topic_progress`.

### M14 · Learn lessons (2–3 sessions)
**Goal:** MDX lessons in `content/learn/`, the lesson layout, the step-through visual component, the quiz and the progress API.
**Done when:**
- [ ] Lessons are server-rendered and readable signed out. Progress saves after sign-in. A topic completes per the PRD §7.4 rule.

### M15 · Study plans, My Prep, notes, bookmarks, lists, daily (2–3 sessions)
**Goal:** PRD §7.9.

## Week 6 — Monetization and launch

### M16 · Student Pro (2 sessions)
**Goal:** Razorpay checkout, a signed and idempotent webhook, `entitlements`, the `can()` helper, and all gates switched on.
**Done when:**
- [ ] A test-mode payment unlocks content within a minute. Replaying the same webhook event doesn't change anything.

### M17 · Arena waitlist, Credits, legal pages (1 session)
**Goal:** `/arena` (DESIGN.md §6.8), `/credits` with licences, Terms and Privacy.

### M18 · Launch QA (2 sessions)
**Done when:**
- [ ] Launch gate: 60 problems pass in all 4 languages, and Pro checkout works end to end in production.
- [ ] The Impeccable detector is clean on all of `src/`, the accessibility pass is done, and Sentry and PostHog events are firing.

## v1.1 — Rooms (weeks 7–10)

### M19+ · Rooms
Orgs and seats, the hidden room pool, invites, the locked-down candidate workspace, reports with a plagiarism flag, and plan limits (PRD §7.12, SYSTEM_ARCHITECTURE.md §4.6). Split into milestones when v1.0 ships.
