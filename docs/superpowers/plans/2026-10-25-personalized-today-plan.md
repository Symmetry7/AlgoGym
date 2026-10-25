# Personalized Today Plan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every authenticated user a deterministic, explainable queue of at most four useful next actions without removing or redesigning the dashboard's existing statistics.

**Architecture:** A shared pure ranker receives normalized candidates from an authenticated `/api/today` aggregator plus an optional untrusted local-training candidate. Supabase stores only the user's active-path/timezone preference and idempotent dismiss/snooze dispositions; the plan itself remains derived. The server loads each source independently so one unavailable source produces diagnostics rather than a failed dashboard.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, TanStack Query, Zod, Supabase/PostgreSQL with RLS, Vitest

**Spec:** `docs/superpowers/specs/2026-10-25-algogym-coherent-learning-system-design.md`

## Global Constraints

- Keep Next.js as the application and API backend; do not add Express or a separate service.
- Preserve the current visual identity, routes, dashboard statistics, and interaction patterns.
- Add no dependency for this slice; use existing React, TanStack Query, Zod, Radix/shared UI, and Vitest facilities.
- Coins/Chakra and AI credits remain separate; Today reads activity but never creates rewards, solves, verification, or mastery.
- Derive `user_id` from the authenticated session and never accept it from request input.
- Service-role credentials remain server-only; all private data is owner-scoped and protected by RLS.
- Use additive migrations, UTC persisted timestamps, validated IANA timezones, and idempotent writes.
- Preserve all pre-existing dirty and untracked work, especially interview-preparation assets/code, local tool configuration, `package.json`/lock changes, and `supabase/migrations/20261026000000_interview_mysql_answers.sql`.
- Do not begin Slice 2 until every Slice 1 gate passes.

## Review Focus

- A malformed or unavailable localStorage notebook must not hide otherwise valid server actions; Task 2 tests this fallback.
- A deleted/completed active path must fall back to the newest ready unfinished owned path without recommending a completed lesson; Task 4 tests this selection.
- One failed source must preserve and rank successful sources while returning a diagnostic; Task 4 tests partial failure.
- Repeating dismiss/snooze requests must leave one disposition and never create reward or solve rows; Tasks 3 and 5 test this.
- Invalid or foreign lesson/path identifiers must never create an open redirect or expose another user's learning content; Tasks 4, 5, and 6 test ownership and deep-link validation.

---

## File Structure

### Create

- `src/features/today/types.ts` — shared Today contracts with no server secrets.
- `src/features/today/rank-today-actions.ts` — eligibility, suppression, deduplication, deterministic ordering, and four-item bound.
- `src/features/today/rank-today-actions.spec.ts` — pure ranker behavior.
- `src/features/today/local-training.ts` — safe adapter from the existing local training notebook to one candidate.
- `src/features/today/local-training.spec.ts` — malformed/unavailable/finished/active local-state cases.
- `src/features/today/use-today.ts` — query, mutations, timezone, and local/server merge.
- `src/features/today/TodayPlan.tsx` — existing-style accessible dashboard composition.
- `src/features/today/TodayPlan.spec.tsx` — server-rendered markup states and accessibility labels.
- `server/today-data.ts` — independent source loaders and normalization.
- `server/today-data.spec.ts` — source selection and partial-failure tests.
- `server/api-handlers/today.ts` — authenticated GET/POST contract.
- `server/api-handlers/today.spec.ts` — auth, origin, validation, ownership, stable errors, and idempotency tests.
- `server/next-api/today.ts` — App Router adapter.
- `scripts/sql/today-tests.sql` — database ownership/idempotency/no-reward assertions.
- `supabase/migrations/<CLI-generated>_personalized_today_plan.sql` — preferences/dispositions schema; exact timestamp is created by the Supabase CLI, not invented manually.

### Modify

- `src/app/api/[...path]/route.ts` — register `/api/today`.
- `src/screens/Dashboard.tsx` — render Today above the unchanged statistics grid.
- `src/app/training/symm/[id]/page.tsx` — pass an optional owned lesson query parameter.
- `src/features/symm-ai/SymmAI.tsx` — accept and validate `initialLessonId` before selecting it; no visual changes.
- `scripts/validate-migrations.mjs` — add opt-in `--today` SQL validation.
- `docs/database.md` — document Today preference/disposition ownership and derived-plan behavior.

## Interfaces

```ts
// src/features/today/types.ts
export type TodayActionKind =
  | "resume_training"
  | "continue_lesson"
  | "review"
  | "upsolve"
  | "start_training"
  | "contest"
  | "activation";

export type TodaySource =
  | "preferences"
  | "learning"
  | "study"
  | "upsolve"
  | "contests"
  | "connections";

export interface TodayCandidate {
  key: string;
  kind: TodayActionKind;
  href: string;
  title: string;
  reason: string;
  eligible: boolean;
  urgency: number;
  learningRelevance: number;
  continuity: number;
  effortMinutes?: number;
  dueAt?: string;
}

export interface TodayDisposition {
  actionKey: string;
  disposition: "dismissed" | "snoozed";
  effectiveDate: string;
  snoozedUntil: string | null;
}

export interface TodaySourceDiagnostic {
  source: TodaySource;
  status: "available" | "unavailable";
}

export interface TodayData {
  localDate: string;
  candidates: TodayCandidate[];
  dispositions: TodayDisposition[];
  diagnostics: TodaySourceDiagnostic[];
}

export function rankTodayActions(
  candidates: TodayCandidate[],
  dispositions: TodayDisposition[],
  now: Date,
  localDate: string,
): TodayCandidate[];
```

Fixed kind priority is `resume_training`, `continue_lesson`, `review`, `upsolve`, `start_training`, `contest`, then `activation`. Remaining comparison is descending urgency, learning relevance, and continuity; then ascending valid `dueAt`; then ascending stable key. Ineligible and actively suppressed candidates are removed before deduplication; the result is capped at four.

---

### Task 1: Pure deterministic Today domain

**Files:**
- Create: `src/features/today/types.ts`
- Create: `src/features/today/rank-today-actions.ts`
- Test: `src/features/today/rank-today-actions.spec.ts`

**Interfaces:**
- Consumes: normalized contracts fixed in this plan.
- Produces: `rankTodayActions(candidates, dispositions, now, localDate): TodayCandidate[]` for server and client use.

- [ ] **Step 1: Write the failing ranker tests**

Add named tests asserting fixed kind priority, descending score fields, due/key tie-breaking, duplicate-key collapse, ineligible exclusion, four-action maximum, current-day dismissal, unexpired snooze, expired snooze restoration, and a disposition from another local date not suppressing today's action.

- [ ] **Step 2: Run the focused test and confirm the intended failure**

Run: `npx vitest --run src/features/today/rank-today-actions.spec.ts`  
Expected: FAIL because the Today types/ranker do not exist.

- [ ] **Step 3: Implement the contracts and minimal ranker**

Keep it pure, immutable, and deterministic. Invalid `dueAt` sorts after valid due dates; it must not throw.

- [ ] **Step 4: Run the focused and related pure tests**

Run: `npx vitest --run src/features/today/rank-today-actions.spec.ts src/lib/theme-training.spec.ts src/lib/upsolve.spec.ts`  
Expected: PASS.

- [ ] **Step 5: Commit the independently working domain unit**

Stage only the three Task 1 files and commit: `feat(today): add deterministic action ranking`.

---

### Task 2: Safe local training continuation candidate

**Files:**
- Create: `src/features/today/local-training.ts`
- Test: `src/features/today/local-training.spec.ts`

**Interfaces:**
- Consumes: `readRoundNotebook(value)` from `src/lib/theme-training.ts` and `TodayCandidate` from Task 1.
- Produces: `readActiveTrainingCandidate(userId, storage, now): TodayCandidate | null`.

- [ ] **Step 1: Write failing local adapter tests**

Test an unfinished round at `algogym:theme-rounds:${userId}` returns `resume_training:${round.id}` with `/training`; malformed JSON, a throwing storage implementation, invalid notebooks, and finished-only history return `null`. Assert no returned title/reason mentions verification, mastery, coins, or rewards.

- [ ] **Step 2: Confirm failure**

Run: `npx vitest --run src/features/today/local-training.spec.ts`  
Expected: FAIL because the adapter does not exist.

- [ ] **Step 3: Implement the adapter**

Signature:

```ts
export function readActiveTrainingCandidate(
  userId: string,
  storage: Pick<Storage, "getItem">,
  now: number,
): TodayCandidate | null;
```

Treat the notebook as untrusted display input. Do not upload it or infer completion/evidence.

- [ ] **Step 4: Verify focused tests and typecheck**

Run: `npx vitest --run src/features/today/local-training.spec.ts src/lib/theme-training.spec.ts`  
Run: `npm run typecheck`  
Expected: PASS.

- [ ] **Step 5: Commit**

Commit Task 2 files as `feat(today): resume local training safely`.

---

### Task 3: Owner-scoped Today persistence

**Files:**
- Create via CLI: `supabase/migrations/<CLI-generated>_personalized_today_plan.sql`
- Create: `scripts/sql/today-tests.sql`
- Modify: `scripts/validate-migrations.mjs`
- Modify: `docs/database.md`

**Interfaces:**
- Produces tables `public.user_learning_preferences` and `public.today_action_dispositions`.
- Writes remain service-role-only; authenticated users may select their own rows through RLS.

- [ ] **Step 1: Create the migration file with the installed/discovered Supabase CLI**

Run `npx supabase --help`, then run the documented equivalent of `supabase migration new personalized_today_plan`. Record the generated exact path in this plan's execution notes; do not rename or hand-invent its timestamp.

- [ ] **Step 2: Write the failing SQL ownership test first**

In `scripts/sql/today-tests.sql`, assert table/RLS existence, anon denial, cross-user denial, authenticated direct-write denial, service-role-compatible upsert uniqueness, `ON DELETE SET NULL` for a deleted active path, and unchanged counts in `solves`, `chakra_awards`, and `chakra_ledger` after Today writes.

- [ ] **Step 3: Add `--today` to migration validation and confirm the new test fails**

Run: `node scripts/validate-migrations.mjs --extra=<generated-migration> --today`  
Expected: FAIL because the migration is empty/tables do not exist. If linked development credentials are unavailable, stop and report this external gate rather than claiming validation.

- [ ] **Step 4: Implement the additive schema**

Create:

- `user_learning_preferences(user_id PK/FK, active_path_id FK nullable ON DELETE SET NULL, timezone, created_at, updated_at)` with an active-path index;
- `today_action_dispositions(id PK, user_id FK, action_key length-bounded, disposition enum check, effective_date, snoozed_until, created_at, updated_at)` with a check pairing snooze/null behavior, unique `(user_id, action_key, effective_date)`, and owner/date index.

Use `(select auth.uid())` in SELECT policies. Revoke direct writes from `anon` and `authenticated`; grant service-role writes. Add migration rollback comments prescribing application-first rollback and retaining rows until export/approval.

- [ ] **Step 5: Run migration validation**

Run: `node scripts/validate-migrations.mjs --extra=<generated-migration> --today`  
Expected: output ends with `Schema, RLS, rewards and ownership-challenge tests passed; all changes rolled back`.

- [ ] **Step 6: Document the schema and commit**

Update `docs/database.md` to state that Today plans are derived, dispositions/preferences are private, and neither can create solve/mastery/reward evidence. Commit only Task 3 files as `feat(today): persist private plan preferences`.

---

### Task 4: Failure-isolated Today source aggregation

**Files:**
- Create: `server/today-data.ts`
- Test: `server/today-data.spec.ts`

**Interfaces:**
- Consumes: an authenticated Supabase client, user ID, and `Date`; existing `groupUpsolveAttempts`/`pendingUpsolves` behavior from `src/lib/upsolve.ts` where extractable without HTTP calls.
- Produces:

```ts
export async function loadTodaySources(
  client: SupabaseClient,
  userId: string,
  now: Date,
  timezone: string,
): Promise<TodayData>;
```

- [ ] **Step 1: Write failing aggregation tests using injected source loaders**

Assert:

- persisted ready/incomplete active path wins; otherwise newest `updated_at` ready/incomplete path wins;
- next lesson is the first incomplete lesson by module then lesson position and href includes `?lesson=`;
- completed paths/lessons and solved problems are excluded;
- least-recently reviewed completed study item yields one legacy review candidate without claiming mastery;
- one bounded pending upsolve is selected with stable ordering;
- only saved future contests within seven days are eligible;
- no content yields a deterministic activation action;
- one rejected loader preserves the other candidates and marks only that diagnostic unavailable;
- batches for large ID lists remain bounded at 80.

- [ ] **Step 2: Confirm failure**

Run: `npx vitest --run server/today-data.spec.ts`  
Expected: FAIL because the aggregator does not exist.

- [ ] **Step 3: Implement independent source loaders and normalization**

Use stored database data only; do not refresh external providers and do not call existing HTTP handlers. Read through the authenticated client so existing RLS applies. Use `Promise.allSettled` at the source boundary. Preferences/dispositions degrade to defaults and an unavailable diagnostic if their read fails.

- [ ] **Step 4: Verify aggregation and regressions**

Run: `npx vitest --run server/today-data.spec.ts src/features/today/rank-today-actions.spec.ts src/lib/upsolve.spec.ts`  
Run: `npm run typecheck`  
Expected: PASS.

- [ ] **Step 5: Commit**

Commit Task 4 files as `feat(today): aggregate next actions safely`.

---

### Task 5: Authenticated Today API and client hook

**Files:**
- Create: `server/api-handlers/today.ts`
- Test: `server/api-handlers/today.spec.ts`
- Create: `server/next-api/today.ts`
- Create: `src/features/today/use-today.ts`
- Modify: `src/app/api/[...path]/route.ts`

**Interfaces:**
- GET `/api/today?timezone=<IANA>` returns `TodayData`.
- POST `/api/today` accepts only:

```ts
{ action: "preference.update"; activePathId?: string | null; timezone?: string }
{ action: "disposition.save"; actionKey: string; disposition: "dismissed" | "snoozed" }
```

- “Later” uses a server-calculated fixed 24-hour expiry; the client cannot submit an expiry.
- Produces `useToday()` with `actions`, `diagnostics`, `dismiss`, `snooze`, `updating`, `isLoading`, `error`, and `refetch`.

- [ ] **Step 1: Write failing handler tests**

Test 401 `AUTH_REQUIRED`, POST origin rejection, strict Zod validation, invalid timezone fallback to UTC, foreign active path rejection, owned active path save, idempotent repeated disposition upsert, server-derived effective date/24-hour snooze, stable `{ error, code }`, cookie flush, and proof no request field controls `user_id`.

- [ ] **Step 2: Confirm handler failure**

Run: `npx vitest --run server/api-handlers/today.spec.ts`  
Expected: FAIL because the handler does not exist.

- [ ] **Step 3: Implement handler, adapter, and catch-all registration**

Follow `serverSupabase`, origin validation, Zod `safeParse`, `private, no-store`, and `finally { flushCookies(); }`. Validate active-path ownership with the authenticated client before service-role upsert. Catch handler errors so Today responses retain stable error codes instead of falling through the generic adapter 503.

- [ ] **Step 4: Implement `useToday()`**

Use query key `['today', user?.id, timezone]`. Read the browser timezone with `Intl.DateTimeFormat().resolvedOptions().timeZone`, merge `readActiveTrainingCandidate` with server candidates through `rankTodayActions`, catch localStorage failures independently, and invalidate only the Today query after mutations.

- [ ] **Step 5: Run API/domain tests and typecheck**

Run: `npx vitest --run server/api-handlers/today.spec.ts server/today-data.spec.ts src/features/today/rank-today-actions.spec.ts src/features/today/local-training.spec.ts`  
Run: `npm run typecheck`  
Expected: PASS.

- [ ] **Step 6: Commit**

Commit Task 5 files as `feat(today): expose authenticated daily plan`.

---

### Task 6: Backward-compatible lesson continuation deep link

**Files:**
- Modify: `src/app/training/symm/[id]/page.tsx`
- Modify: `src/features/symm-ai/SymmAI.tsx`
- Test: add the narrow deep-link case to the closest existing Symm component test or create `src/features/symm-ai/symm-initial-lesson.spec.ts` for an extracted pure selector.

**Interfaces:**
- `SymmAI` gains optional `initialLessonId?: string`.
- The initial ID is used only if it exists in the loaded owned path's lesson list; otherwise existing first-incomplete selection remains.

- [ ] **Step 1: Extract/write a failing pure selection test**

Assert a valid initial lesson wins, a foreign/missing ID falls back to the first incomplete owned lesson, and all-complete behavior remains unchanged.

- [ ] **Step 2: Confirm failure**

Run the focused Symm selector test.  
Expected: FAIL because initial lesson selection is unsupported.

- [ ] **Step 3: Implement query-param plumbing and validated selection**

Read `searchParams.lesson` in the App Router page, pass it as a string only, and validate membership after path detail loads. Make no visual/CSS changes.

- [ ] **Step 4: Run focused Symm regressions and typecheck**

Run: `npx vitest --run src/features/symm-ai/SymmSidebar.spec.tsx src/features/symm-ai/LessonContent.spec.tsx <new-selector-test>`  
Run: `npm run typecheck`  
Expected: PASS.

- [ ] **Step 5: Commit**

Commit Task 6 files as `feat(symm): open owned lesson deep links`.

---

### Task 7: Existing-style Today dashboard panel

**Files:**
- Create: `src/features/today/TodayPlan.tsx`
- Test: `src/features/today/TodayPlan.spec.tsx`
- Modify: `src/screens/Dashboard.tsx`

**Interfaces:**
- Consumes `useToday()` from Task 5.
- Produces a Today panel before the existing `.ag-dashboard-grid`; all current statistics/cards remain unchanged below it.

- [ ] **Step 1: Write failing server-rendered component tests**

Using `renderToStaticMarkup`, assert:

- the first of at most four actions is identified as the primary next action;
- every action renders its title and explanation;
- dismiss and “Later” controls have labels containing the action title and practical button sizing classes;
- loading, empty/new-user, whole-request error/retry, and partial-source `role="status"` states are useful;
- a long title can wrap rather than requiring horizontal overflow;
- no copy equates local completion with rewards/mastery or conflates coins with AI credits.

- [ ] **Step 2: Confirm failure**

Run: `npx vitest --run src/features/today/TodayPlan.spec.tsx`  
Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the panel with existing primitives**

Compose `DataPanel`, `Button`, `Link`, Lucide icons, and current typography/borders/colors. Do not add a new design language or modify global dashboard CSS unless an actual responsive defect is demonstrated. Async notices use `role="status"`; retry remains keyboard accessible.

- [ ] **Step 4: Integrate it into `Dashboard.tsx`**

Call `useToday()` and render `TodayPlan` after existing tracker/study feedback and before the existing statistics grid. Do not remove, reorder, or restyle the existing statistics/cards.

- [ ] **Step 5: Run focused tests, all Today tests, and typecheck**

Run: `npx vitest --run src/features/today/TodayPlan.spec.tsx src/features/today/*.spec.ts server/today-data.spec.ts server/api-handlers/today.spec.ts`  
Run: `npm run typecheck`  
Expected: PASS.

- [ ] **Step 6: Commit**

Commit Task 7 files as `feat(dashboard): show personalized today plan`.

---

### Task 8: Slice verification and review

**Files:**
- Modify only if verification finds a Slice 1 regression.
- Record exact results in the final implementation report; do not overwrite unrelated planning/user files.

**Interfaces:**
- Consumes all Slice 1 tasks.
- Produces a verified, review-ready Slice 1 with no claim about later phases.

- [ ] **Step 1: Inspect scope and accidental overlap**

Run: `git status --short` and `git diff -- <all Slice 1 paths>`.  
Expected: only intentional Slice 1 changes plus the already-recorded unrelated worktree changes.

- [ ] **Step 2: Run full non-live verification**

Run: `npm test`  
Run: `npm run typecheck`  
Run: `npm run build`  
Expected: 0 failing non-live tests, typecheck exit 0, production build exit 0.

- [ ] **Step 3: Run migration validation**

Run: `node scripts/validate-migrations.mjs --extra=<generated-migration> --today`  
Expected: ownership/RLS/reward assertions pass and the transaction rolls back. If credentials are required or unavailable, report the gate and stop before claiming Slice 1 complete.

- [ ] **Step 4: Run browser smoke checks against the existing dev server**

Verify the dashboard at 320, 375, 430, 768, 1280, and 1440 px; keyboard through every Today action/control; confirm no horizontal overflow; confirm lesson deep link opens the intended owned lesson; confirm dismiss and Later survive refresh; confirm a simulated source failure leaves other actions visible.

- [ ] **Step 5: Request independent code review**

Use `superpowers:requesting-code-review`; evaluate findings with `superpowers:receiving-code-review`. Fix only verified Slice 1 issues, rerun their focused tests, then rerun typecheck/build as appropriate.

- [ ] **Step 6: Final verification and milestone commit**

Use `superpowers:verification-before-completion`, rerun fresh required commands, stage only Slice 1 files, and commit any review fixes as `fix(today): address slice review findings` (omit the commit if no changes).

## Self-Review Record

- **Spec coverage:** Slice 1 covers deterministic ranking, maximum four actions, one primary action, reasons, dismiss/snooze, new-user activation, solved/completed exclusion, source isolation, local active-session recovery, existing statistics preservation, keyboard/mobile checks, and no AI dependency. Later revision scheduling, practice attribution, and server-backed training remain explicitly in later slices.
- **Step scan:** Every task has a failing test, intended failure, smallest implementation boundary, focused verification, and isolated commit. The one unavoidable dynamic filename is generated by the required Supabase CLI and recorded at execution.
- **Type consistency:** `TodayCandidate`, `TodayDisposition`, `TodayData`, and diagnostics use the same property names across ranker, server, hook, and component.
- **Review focus:** Each of the five high-risk cases is assigned to explicit tests in Tasks 2–6.
- **Proportion:** The plan fixes contracts and observable assertions without transcribing implementation bodies.
