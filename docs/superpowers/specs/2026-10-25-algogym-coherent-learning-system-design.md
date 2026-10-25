# AlgoGym Coherent Learning System — Design Specification

**Status:** Draft for approval  
**Date:** 2026-10-25  
**Architecture:** Next.js 16 App Router, React 19, TypeScript, Supabase/PostgreSQL  
**Delivery model:** Sequential vertical slices

## 1. Intent

AlgoGym already contains useful learning, training, workspace, provider, contest, and community capabilities. This program connects them into one trustworthy loop:

> learning goal → guided lesson → recommended practice → timed attempt → verified solve → mastery update → revision → next best action

The primary product question is: **“What is the most useful thing I should do next?”**

This specification defines the architecture, data boundaries, rollout strategy, and acceptance gates for delivering that loop without replacing the Next.js backend, redesigning the existing interface, or risking existing user data.

## 2. Chosen approach

### 2.1 Sequential vertical slices

Each phase is delivered as one or more independently useful vertical slices. A slice includes, where applicable:

1. Additive database migration and rollback notes.
2. Authenticated server/API behavior.
3. Pure domain logic and stable types.
4. The minimum UI integration needed to expose the behavior.
5. Focused tests, authorization checks, typecheck, and build verification.

A later phase does not begin while the current phase's verification gate is failing.

This was selected over:

- **Database-first delivery:** would produce a large dormant schema and defer user value and integration learning.
- **UX-first delivery:** would create optimistic interfaces before security, persistence, and provider truth were available.

Vertical slices minimize blast radius, preserve deployability, and allow each architectural assumption to be proven before the next phase depends on it.

### 2.2 No visual redesign

The current UI identity, page layouts, routes, component vocabulary, and interaction patterns are preserved. New behavior will reuse existing design tokens, Radix primitives, shared panels, buttons, cards, typography, and responsive conventions.

Allowed UI changes are limited to:

- inserting the minimum controls and states required by a feature;
- improving hierarchy within an existing screen without changing its visual identity;
- fixing overflow, focus, semantics, contrast, touch targets, reduced-motion behavior, and zoom usability;
- adding a command/search surface using the existing command primitive;
- adding backward-compatible query parameters or links for stable deep links.

The existing navigation remains available. Phase 6 adds search and improves grouping/discoverability, but does not perform a sidebar or site-wide visual redesign.

## 3. Non-negotiable boundaries

1. Coins/Chakra and AI credits remain separate ledgers and concepts.
2. Only authenticated, idempotent server/database operations may mint coins, and only from eligible provider-verified activity.
3. Client completion, local training state, imported history, or lesson status cannot mint rewards or assert mastery.
4. Billing remains unavailable and is not advertised until checkout is genuinely configured.
5. Provider capability claims come from one shared capability model.
6. Codeforces may supply accepted-submission evidence. LeetCode profile aggregates are not individual accepted-submission evidence for rewards.
7. Existing learning paths, lessons, tutor conversations, training records, profiles, societies, rewards, and routes remain compatible.
8. All private data is authenticated, owner-scoped, and protected by RLS.
9. Service-role and Gemini credentials remain server-only.
10. Persisted timestamps use UTC. User-local dates are derived using a validated IANA timezone.
11. New ingestion, synchronization, imports, and review actions are idempotent.
12. No destructive Git operations, destructive migrations, or deletion of user artifacts.

## 4. Explicit non-goals

- Replacing Next.js route handlers with Express.js or a separate API server.
- A broad visual redesign or replacement design system.
- A new queue vendor or dedicated worker before measured load justifies it.
- Increasing cron frequency before deployment constraints and runtime are measured.
- Treating lesson reading, locally imported history, or client state as verified mastery.
- Reward support for providers without suitable solve evidence.
- Enabling paid checkout.
- A single repository-wide refactor, global strictness conversion, or wholesale dependency cleanup.
- Deleting existing screenshots, deployment bundles, untracked work, or interview-preparation artifacts.

## 5. Product decisions

### 5.1 Active learning path

The user may explicitly choose an active learning path. If none is chosen, the system selects the most recently updated unfinished path. A deleted, inaccessible, or completed path is ignored automatically. This selection is persisted as a preference, not inferred independently on every screen.

### 5.2 First-run activation

Activation is defined as completing a useful learning or practice action, not completing identity, college, community, or provider setup. A visitor may explore a read-only sample. A signed-in user may save or begin a path before optional provider and community steps. Provider connection is requested only when verified solves or synchronization unlock clear value.

### 5.3 Daily plan persistence

The Today plan is computed deterministically from current source data; generated plan snapshots are not initially persisted. Only user preferences and action dispositions (dismiss/snooze) are stored. This avoids stale duplicated state while preserving user intent.

### 5.4 Job service level

Provider and AI background work remains a Next.js/Vercel cron-backed, daily best-effort system during this program. The reliability phase first fixes correctness, fairness, bounded execution, recovery, and visibility. A dedicated worker or faster schedule requires measured demand and a separate infrastructure decision.

## 6. System architecture

### 6.1 Boundaries

```text
React screens and focused feature components
        ↓ typed hooks / TanStack Query
Next.js App Router API adapters
        ↓ authenticated handler contracts
Pure domain services + provider capability registry
        ↓ owner-scoped queries / authoritative RPCs
Supabase PostgreSQL with constraints, indexes, and RLS
        ↓
External providers (Codeforces evidence, LeetCode aggregates) / Gemini
```

- **Client:** renders data, gathers intent, supports local/offline fallback, and never determines rewards, verification, ownership, or mastery.
- **API adapters:** parse requests, authenticate, validate input, and translate handler results into consistent HTTP responses.
- **Domain services:** contain deterministic ranking, scheduling, state transitions, reconciliation, and capability rules.
- **Database:** enforces ownership, uniqueness, valid transitions where practical, idempotency keys, and authoritative reward/mastery writes.
- **Providers:** contribute only the capabilities and evidence declared by the shared registry.

### 6.2 Error contract

New and materially changed APIs return stable errors:

```ts
type ApiError = {
  error: string;
  code: string;
  details?: Record<string, unknown>;
};
```

Codes are stable and machine-readable, for example `AUTH_REQUIRED`, `NOT_FOUND`, `FORBIDDEN`, `VALIDATION_FAILED`, `CONFLICT`, `PROVIDER_UNAVAILABLE`, `RATE_LIMITED`, and `TERMINAL_FAILURE`. User-facing copy is selected in the UI and is not used for control flow.

### 6.3 Failure isolation

Aggregators use settled results and preserve successful data if one source fails. The Today plan, global search, provider dashboard, and job runner must expose partial-result states rather than converting one failure into a blank screen.

## 7. Data and migration strategy

Every schema change is additive and phase-scoped. Migration files include a rollback note describing either a safe reverse operation or why rollback must be application-first. The deployment order is migration first, compatible application second, then feature exposure. Existing columns and tables are not renamed or dropped during feature delivery.

All exposed tables receive:

- RLS enabled;
- policies scoped with `(select auth.uid()) = user_id` or ownership through an indexed parent relation;
- both `USING` and `WITH CHECK` for updates;
- indexes on ownership columns and foreign keys;
- explicit unique/check constraints supporting idempotency and state validity;
- least-privilege grants appropriate to the project's Data API configuration.

Security-definer functions are used only when an authoritative atomic operation genuinely requires them. Such functions validate the caller, use a fixed empty `search_path`, live outside exposed schemas when feasible, and have explicit execute grants. Service-role operations remain server-only.

### 7.1 Preferences and Today dispositions

Add a user-owned learning preferences record containing active path, timezone, and optional daily-plan preferences. Add user-owned Today action dispositions keyed by a stable action key and effective date/window.

The plan itself stays derived. Dismissal applies to the current local day; snooze has a UTC expiry. Expired dispositions no longer suppress candidates. Constraints prevent duplicate dispositions for the same user, action, and effective window.

### 7.2 Practice attribution and mastery evidence

Add an attribution record connecting a recommended problem to its user, path, module, lesson, topic, and origin. Its lifecycle distinguishes assigned, started/attempted, verified solved, and mastery-contributing states.

The client may request that practice begin, but cannot set verified or mastery states. A provider synchronization service correlates normalized problem identity and accepted-submission evidence, then atomically upserts verification and mastery evidence. A unique evidence key prevents duplicate synchronization from creating duplicate mastery or rewards.

Mastery for a topic requires two distinct provider-verified problem solves. At least one of those solves must occur after the originating lesson's practice assignment was created. Earlier verified history may supply the other evidence item, so prior knowledge is recognized without allowing lesson reading alone to demonstrate mastery. Repeated submissions for the same normalized problem count once toward that topic's mastery threshold.

A verified submission completes only the earliest active assignment for its normalized problem. The evidence may still contribute once to user-level topic mastery, but it does not complete multiple lesson assignments and cannot be reused for duplicate module rewards. Later assignments for that same problem are treated as already-solved and must be replaced or excluded rather than waiting for the evidence to be reused.

Lesson reading remains separate from practice and mastery.

### 7.3 Training persistence

Add owner-scoped training profile, session, session-problem, and pause/event records. Session state includes a server version for optimistic concurrency and an idempotency key for transitions/imports. A partial unique index prevents multiple active remote sessions per user.

Authenticated state autosaves to the server. Anonymous state remains local. On first authenticated use, existing local history is validated and imported once using stable client import identifiers. Imported outcomes are explicitly unverified and cannot mint rewards or establish provider-verified mastery.

When local and remote active sessions conflict, the most recently server-confirmed active session remains authoritative. The local session is preserved as a recoverable/importable draft or completed local record; it is never silently discarded. JSON export remains, and JSON import validates schema/version and deduplicates by import identity.

### 7.4 Revision scheduling

Add one owner-scoped review state per eligible question and an append-only/idempotent review event. Scheduling is deterministic and explainable. Inputs include last review, review count, recall/confidence, failed attempts, difficulty, verified solve evidence, and recent performance when available.

The initial algorithm uses bounded interval steps rather than opaque AI generation. A review rating selects a multiplier/step, failures reset or shorten the interval, and overdue time does not impose an additional penalty. The next due instant is calculated from a UTC anchor plus whole-day intervals; queue inclusion is evaluated in the user's validated timezone.

An externally verified solve marks the related item learned and advances it to a longer retention interval; it does not permanently remove the item from revision. Future recall ratings continue to adjust that interval. Deleted, archived, or inaccessible content is excluded from the queue.

### 7.5 Activation state

Persist primary goal and onboarding progress in a user-owned activation record or a compatible existing profile extension. GET operations are read-only; no onboarding read endpoint may silently publish a profile or mutate identity. Steps are skippable where optional and progress is resumable.

### 7.6 Job operations

Add structured job-run and job-event records with correlation ID, job/provider/stage, status, attempt count, timestamps, latency, safe error code, and lease metadata. Do not store prompts, access tokens, secrets, private generated content, or raw provider payloads.

Queue claims use atomic updates and row locking (`FOR UPDATE SKIP LOCKED` where suitable), leases expire, and terminal failures stop retrying. Partial indexes support pending/stale queries. Fair ordering and durable cursors prevent the same oldest contest registrations from starving later work.

## 8. Vertical slice sequence

### Slice 1 — Personalized Today plan

Create `src/features/today/` with explicit candidate/action types and a pure deterministic ranker. Aggregate current account, learning, study, tracker, contest, and training signals with per-source failure isolation. Return at most four actions, one primary action, and a reason for every action.

Initial priority policy:

1. Recover an active timed session when one exists.
2. Continue the next incomplete lesson in the active path.
3. Complete due revision work.
4. Upsolve an attempted unsolved problem.
5. Start focused training supported by current learning or weakness evidence.
6. Prepare for a saved upcoming contest.
7. For a new/disconnected user, begin a sample/path or connect Codeforces when verification is the next unlock.

Eligibility filters always run before ranking: completed lessons, verified solved problems, inaccessible content, expired contests, and currently dismissed/snoozed items are excluded. Ties use stable keys, never randomness or AI.

The existing dashboard statistics remain. A focused plan block is inserted using existing visual components; no dashboard redesign occurs.

**Gate:** returning and new-user paths, deterministic ordering, exclusions, partial-source failure, dismiss/snooze behavior, mobile/keyboard interaction, typecheck, related tests, build.

### Slice 2 — Closed learning/practice loop

Add typed lesson-to-practice context and durable attribution. Starting from a lesson creates an assignment/context before navigating to practice. Training and workspace links carry a stable context identifier, and returning to Symm resolves the originating path/module/lesson.

Provider synchronization, not the client, moves matching practice to verified. Mastery projections distinguish lesson read, attempted, verified practice complete, and mastery demonstrated. Existing paths without practice context retain their existing behavior.

**Gate:** context round trip, verified evidence propagation, ownership, deleted paths, unavailable providers, duplicate sync, no reward/mastery forgery.

### Slice 3 — Server-backed training history

Introduce authenticated session APIs and typed hooks while retaining anonymous/local operation. Autosave every meaningful transition with idempotency and version conflict handling. Resume the remote active session across devices. Run a one-time local import after sign-in and retain export/import support.

**Gate:** refresh/cross-device resume, offline fallback, import deduplication, conflict behavior, RLS/authorization, migration checks, and proof that level changes do not create coins.

### Slice 4 — Spaced revision and weakness detection

Replace the fixed 20-question threshold with the deterministic review scheduler and a bounded daily queue. Users rate recall/confidence, receive an explanation, and can snooze. Due reviews become Today candidates.

**Gate:** algorithm unit tests, timezone stability, idempotent events, overdue/no-penalty behavior, deleted/inaccessible content exclusion, empty states.

### Slice 5 — Provider capability and sync status

Create a single typed provider registry describing connection support, import depth, individual-solve verification, reward eligibility, and retry capability. Status combines this registry with the latest successful snapshot and current job state; unavailable metrics are `unknown`, never fabricated zeroes.

Codeforces exposes verification/reward capability where evidence is eligible. LeetCode exposes aggregate/profile capability without individual reward verification. Retry is authenticated, rate-limited, and preserves the last successful snapshot.

**Gate:** disconnected, queued, retrying, stale, failed, unsupported, and partial-outage states; consistent copy across onboarding, profile, statistics, and settings.

### Slice 6 — Global search and discoverability

Add a keyboard- and mobile-accessible command interface based on the existing command primitive. Search sources return bounded typed groups independently. Initial implementation may query existing bounded user-owned datasets, but large catalogs use server-side search/pagination and never require full client download.

Before a result type is included, its target receives a stable backward-compatible URL/query parameter. Search covers learning paths/lessons, problems, workspace questions, sheets, notes, interview content, contests, and societies. Recent query strings may remain local, but sensitive result content is not persisted.

The existing navigation and URLs remain. Labels/grouping may be clarified, but there is no visual navigation redesign in this program.

**Gate:** “binary search” cross-domain result, keyboard/mobile use, stable deep links, source failure isolation, bounded queries, loading/empty/error states.

### Slice 7 — First-run activation and demo

Refactor onboarding into resumable progressive activation using existing UI components. Visitors can use a read-only sample lesson/path or training round. Signed-in users choose a goal and complete a meaningful action before optional provider/community setup. Coins and AI credits receive distinct concise explanations; checkout is absent.

Analytics record step identifiers, completion, and drop-off without prompt contents or sensitive response values.

**Gate:** useful pre-auth experience, resumability, skips, post-auth next action, read-only GET behavior, privacy-safe analytics.

### Slice 8 — Mobile and accessibility hardening

Audit the named primary flows at 320, 375, 430, 768, 1280, and 1440 px plus 200% zoom. Fix semantics and responsiveness inside the existing design. Convert only overflowing representations (for example, tables to existing card patterns) where necessary.

Priorities include a focus-trapped/Escape-closing interview mobile drawer, authenticated header behavior, visible focus, 44×44 px practical targets, async status announcements, long/unbroken content handling, and targeted reduced motion. Add automated accessibility checks and browser/visual regression coverage, including the mobile leaderboard.

**Gate:** no horizontal page overflow, primary keyboard workflows, no serious/critical automated accessibility findings, usable 200% zoom, responsive regression suite.

### Slice 9 — Job reliability and observability

Keep the current Next.js cron architecture while adding structured runs/events, correlation, time budgets, fair claiming, lease recovery, retry ceilings, terminal failure, and user-safe status. Isolate job families so one failure does not hide or cancel unrelated outcomes.

Add an authenticated, authorization-protected operations view for stuck jobs, retry counts, provider failure rates, Gemini failures, and oldest queued age. It exposes safe metadata only.

**Gate:** interruption recovery, final-attempt recovery, duplicate delivery, fencing, timeout, starvation/fairness, terminal failure, credit reconciliation, and operator diagnosis.

### Slice 10 — Engineering quality and codebase reduction

Split large screens by domain responsibility only after their behavior is protected by tests. Extract business hooks and pure functions before presentational pieces. Remove UI primitives and dependencies only after static import checks and a production build.

Add ESLint rules appropriate to Next.js/React/TypeScript/hooks/accessibility, deterministic CI, focused Playwright configuration, and the specified end-to-end flows. Update AGENTS.md to the real Next.js architecture. Increase TypeScript strictness incrementally only where the touched code can satisfy it without unrelated churn.

**Gate:** no circular feature dependencies, deterministic CI, import-clean removals, full test/typecheck/build/migration/browser checks, no meaningless wrapper decomposition.

## 9. Today ranking contract

The ranker accepts normalized candidates rather than feature-specific database rows:

```ts
type TodayCandidate = {
  key: string;
  kind: "resume_training" | "continue_lesson" | "review" | "upsolve" | "start_training" | "contest" | "activation";
  href: string;
  title: string;
  reason: string;
  eligible: boolean;
  urgency: number;
  learningRelevance: number;
  continuity: number;
  effortMinutes?: number;
  dueAt?: string;
};
```

Ranking uses a documented lexicographic tuple: fixed kind priority, urgency, learning relevance, continuity, due time, then stable key. The implementation may tune numeric bounds in tests, but it may not use hidden AI scoring or non-deterministic tie-breaking.

The aggregator returns source diagnostics separately from actions so the UI can show a small partial-data notice without polluting action reasons.

## 10. Security and trust model

- API handlers derive `user_id` from the authenticated session, never request input.
- Zod or the established validation layer parses every changed input boundary.
- Client-supplied reward amounts, provider verification flags, mastery states, result verification, and ownership fields are ignored/rejected.
- Provider problem identifiers are normalized at the server boundary before matching.
- Accepted evidence is stored with provider/source identity and a unique external evidence key.
- Reward and mastery transitions happen atomically or are independently idempotent so retries cannot multiply effects.
- Parent ownership is checked when writing child records, both in handlers and RLS.
- Admin operations require an existing server-side authorization mechanism; a client boolean or editable user metadata is insufficient.
- Logs contain correlation IDs and safe codes, not secrets, credentials, prompts, private generated content, or provider response bodies.

## 11. API and type organization

New feature code is colocated by domain rather than added to large screen files:

```text
src/features/today/
src/features/practice-context/
src/features/training-history/
src/features/revision/
src/features/provider-status/
src/features/global-search/
src/features/activation/
src/features/job-operations/
server/api-handlers/
server/next-api/
supabase/migrations/
```

Each feature favors:

- `types.ts` for explicit shared domain contracts;
- pure modules for ranking/scheduling/reconciliation;
- server query/service modules for persistence and authorization;
- focused hooks for client cache behavior;
- components that compose existing UI primitives.

Server and client types share a source when safe; server-only fields and secrets never enter shared bundles.

## 12. File-impact map

Likely existing integration points include:

- Dashboard: `src/screens/Dashboard.tsx`
- Symm: `src/features/symm-ai/SymmAI.tsx`, Symm handlers and recommendation service
- Training: `src/features/training/TrainingGym.tsx`, `ThemeRounds.tsx`, training domain modules
- Study/revision: `src/screens/Workspace.tsx`, study hooks/types/handlers
- Providers: account/tracker hooks, profile connection components, sync handlers/jobs
- Navigation/search: `src/components/layout/Layout.tsx`, command primitive, route screens
- Onboarding: `src/screens/Onboarding.tsx`, onboarding handlers
- Jobs: sync cron adapter and provider/Symm/community job services
- Quality: package scripts, lint configuration, CI workflows, Playwright configuration, AGENTS.md

The implementation plan must refine this map using exact symbols and must identify pre-existing edits before assigning any file to a task.

## 13. Test strategy

Every behavior follows red → green → refactor:

1. Add a focused failing test and confirm the intended failure.
2. Implement the smallest correct behavior.
3. Run the focused test and related regressions.
4. Run typecheck before the slice is considered working.
5. Run production build and migration validation at the slice gate when affected.

Coverage layers:

- pure unit tests for ranking, scheduling, provider capability, reconciliation, and state transitions;
- API tests for authentication, authorization, validation, stable errors, and idempotency;
- migration/RLS tests for ownership, constraints, indexes, and cross-user denial;
- component interaction tests for loading, empty, success, partial failure, retry, and terminal error;
- browser tests for deep links, persistence, keyboard use, responsive viewports, and critical happy paths;
- accessibility scans plus manual keyboard/focus verification for primary flows.

Live-provider tests remain opt-in. Deterministic fixtures cover normal CI.

## 14. Rollout and rollback

### Rollout

1. Apply the additive migration.
2. Validate schema, policies, indexes, and grants in a non-production environment.
3. Deploy backward-compatible server code.
4. Deploy the minimum UI integration.
5. Observe error/job metrics and then make the slice the default path.

### Rollback

- Prefer rolling back application exposure while leaving additive tables/columns intact.
- Do not drop tables containing imported or newly created user data during an emergency rollback.
- Disable writes for the affected feature, retain data, and deploy the previous compatible application.
- A later cleanup migration may remove unused schema only after explicit approval and a verified backup/export.
- Job changes retain old records and use versioned event interpretation where contracts evolve.

Every migration includes phase-specific rollback notes and any required data export command.

## 15. Major risks and mitigations

| Risk | Mitigation |
|---|---|
| Forged rewards/mastery | Server-only evidence correlation, authoritative RPCs, unique evidence keys, idempotent writes |
| Cross-user data access | Owner-derived authentication, RLS, indexed parent ownership, negative authorization tests |
| Existing local training lost | Non-destructive one-time import, stable import IDs, conflict preservation, export retained |
| Today recommendations become stale or contradictory | Derived plan, eligibility filters, stable precedence, source diagnostics, no persisted snapshots initially |
| Provider outage erases useful data | Preserve last successful snapshot and display freshness/job state separately |
| Search becomes an unbounded client download | Server-side bounded results, per-source limits, debounce, pagination/indexing where needed |
| Cron runtime/starvation | Bounded claims, fair cursors, time budgets, independent outcomes, lease recovery |
| Scope turns into redesign/refactor | Minimum UI rule, phase gates, exact file-impact review, no unrelated cleanup |
| Dirty worktree overwrites user work | Record baseline, avoid unrelated files, inspect diffs before each commit, never delete artifacts |
| Migration rollback destroys new user data | Application-first rollback and additive schema retention |

## 16. Baseline and completion gates

The recorded pre-implementation baseline is:

- `npm run typecheck`: passed.
- `npm test`: 124 passed; 6 opt-in live tests skipped.
- `npm run build`: passed; 28 routes generated.

The repository already contains user changes and untracked artifacts, especially interview-preparation work, generated QA images, product/design documents, and local tool configuration. They are outside this program unless a slice explicitly requires a compatible integration.

The program is complete only when every slice meets its stated gate and the final full verification passes:

- typecheck;
- all non-live tests;
- production build;
- migration validation and RLS checks;
- selected desktop/mobile browser smoke suites;
- accessibility scans with no serious or critical findings;
- review of the final diff for unrelated changes;
- documentation updated to implemented behavior;
- deployment, environment, remaining-risk, and rollback report.

## 17. Implementation planning rule

The execution plan must decompose every slice into small test-first tasks with exact file paths, commands, expected failures/results, and focused commits. Parallel agents may inspect or work on independent files only when shared state and ordering are explicit. Database migrations and cross-feature contracts remain sequential. No task may claim completion without fresh verification evidence.
