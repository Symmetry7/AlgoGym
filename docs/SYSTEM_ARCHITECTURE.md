# Algogym — System Architecture

**Version:** 1.0 · **Date:** 24 Nov 2026 · **Status:** Draft for review

Related docs: [PRD.md](./PRD.md) · [DESIGN.md](./DESIGN.md)
Diagram (Eraser): https://app.eraser.io/workspace/egpUpJy9fAPA3ACbDQGI

---

## 1. Summary

Algogym runs as **one Next.js app on Vercel**, **Supabase** for Postgres/Auth/Realtime/Storage, and **one Express "engine" service on Railway** that queues and judges code through **Judge0**.

- Everything simple (pages, lessons, problems, progress, billing) lives in Next.js.
- Everything long-running (judge queue now; Arena and Rooms realtime later) lives in the engine.
- The browser never talks to Judge0, never sees hidden tests, and never decides what it is allowed to see.

### Principles
1. **Two deployables, not ten.** Next.js app + engine. No more services until a real bottleneck appears.
2. **Server decides access.** Pro and Rooms entitlements are checked on the server; RLS backs it up.
3. **Content is fast and indexable.** Landing, Learn and problem statements are server-rendered and cached.
4. **Additive data changes.** Production has real users: new tables and columns only; old tables move to a `legacy` schema.
5. **Swappable judge.** Judge0 sits behind one interface so hosted RapidAPI can become self-hosted Judge0 later.

## 2. Architecture diagram

```mermaid
flowchart LR
  subgraph Users
    B[Browser]
  end
  subgraph Vercel["Next.js app (Vercel)"]
    CDN[Edge CDN<br/>assets, cube loop, ISR pages]
    P[Server Components pages<br/>Landing, Pricing, Roadmap, Learn,<br/>Problems, Companies, My Prep]
    API[Route handlers /api<br/>progress, notes, lists,<br/>run/submit proxy, webhooks]
  end
  subgraph Supabase
    AUTH[Auth<br/>Google, email]
    PG[(Postgres + RLS)]
    RT[Realtime]
    ST[Storage]
  end
  subgraph Railway["Engine (Express on Railway)"]
    EAPI[Engine API<br/>POST /v1/jobs]
    R[(Redis<br/>BullMQ + rate limits)]
    W[Judge worker]
    LATER[Later: Arena/Rooms<br/>Socket.io]:::later
  end
  J0[Judge0 RapidAPI]
  RZ[Razorpay]
  RS[Resend email]
  MON[Sentry + PostHog]

  B --> CDN
  B --> AUTH
  B --> API
  P --> PG
  P --> ST
  API --> PG
  API -- HMAC --> EAPI
  EAPI --> R --> W
  W -- service role --> PG
  W --> J0
  PG --> RT --> B
  B --> RZ
  RZ -- signed webhook --> API
  API --> RS
  API --> MON
  classDef later stroke-dasharray: 5 5
```

## 3. Components

| Component | Tech | Hosting | Responsibility |
| --- | --- | --- | --- |
| Web app | Next.js (App Router, React Server Components), TypeScript, Tailwind | Vercel | All pages, SSR/ISR, route handlers, auth session, entitlement checks, Razorpay webhook |
| Lessons | MDX files in the repo (`content/learn/<track>/<topic>.mdx`) | Built by Vercel | Free Learn pages; versioned in Git, reviewed by PR, statically generated |
| Database | Supabase Postgres | Supabase (Mumbai region) | Content metadata, problems, tests, users, progress, submissions, billing, Rooms |
| Auth | Supabase Auth | Supabase | Google + email; existing accounts kept |
| Realtime | Supabase Realtime | Supabase | Pushes submission status changes to the browser (no WebSocket server needed on Vercel) |
| File storage | Supabase Storage | Supabase | Lesson images, company logos, topic icons |
| Engine API | Node.js + Express, TypeScript | Railway | Accepts judge jobs (HMAC-signed), rate limits, health checks |
| Queue | BullMQ on Redis | Railway Redis | Judge jobs, retries, per-user rate-limit counters |
| Judge worker | Node.js (same repo as engine, separate process) | Railway | Builds one Judge0 submission per job (user code + harness, all cases), polls the result, compares outputs, maps verdicts, writes results |
| Code execution | Judge0 | RapidAPI (hosted) | Runs untrusted code in sandboxes with time/memory limits |
| Payments | Razorpay Subscriptions | Razorpay | Pro and Rooms plans, UPI and cards |
| Email | Resend | Resend | Receipts, magic links (if not using Supabase's), Rooms invites |
| Monitoring | Sentry, PostHog | SaaS | Errors in both services, product analytics and funnels |

### Repository layout (monorepo, npm workspaces)
```
algogym/
├─ apps/
│  ├─ web/            # Next.js app (existing repo becomes this)
│  └─ engine/         # Express API + BullMQ worker
├─ packages/
│  ├─ db/             # Generated Supabase types, query helpers (no migrations)
│  ├─ judge/          # Judge interface + Judge0 adapter + harnesses + verdict mapping
│  └─ shared/         # zod schemas, constants (languages, limits, plans)
├─ supabase/          # Stays at the repo root: migrations/ (source of truth), functions/
├─ content/learn/     # MDX lessons
└─ scripts/           # data/import-companies.mjs (CSV import), seeders, content validators,
                      # build-icons.ts (copies used Devicon/Simple Icons SVGs → public/icons, writes iconMap.ts)
```
`supabase/migrations/` stays where the Supabase CLI and the production migration ledger expect it; moving it would break `supabase db push` against 51 already-applied migrations. npm workspaces (not pnpm) keep the existing `package-lock.json` and tooling.

## 4. Key flows

### 4.1 Run / Submit
```mermaid
sequenceDiagram
  participant B as Browser
  participant N as Next.js /api/judge
  participant E as Engine API
  participant Q as Redis (BullMQ)
  participant W as Judge worker
  participant DB as Postgres
  participant J as Judge0
  participant RT as Realtime

  B->>N: POST {problemId, lang, code, mode: run|submit, customCases?}
  N->>N: check session, Pro gate for locked problem
  N->>DB: insert submission (status=queued)
  N->>E: POST /v1/jobs (HMAC-signed, submissionId)
  E->>E: rate limit by userId (Redis)
  E->>Q: enqueue job
  E-->>N: 202 {jobId}
  N-->>B: 202 {submissionId}
  B->>RT: subscribe submissions:id=submissionId
  Q->>W: job
  W->>DB: load code + tests (public for run, public+hidden for submit)
  W->>J: POST /submissions (user code + harness, all case inputs in stdin)
  W->>J: poll one token
  W->>W: parse per-case JSON lines, compare with expected outputs
  W->>DB: update submission (verdict, per-case results, runtime, memory)
  DB-->>RT: row change (owner-only, via RLS)
  RT-->>B: verdict + results
```
- **One Judge0 submission per Run or Submit**, never one per test case. Judge0 is billed and rate-limited per submission.
- **Run** uses public examples + the user's custom cases; results are stored for 24 h only.
- **Submit** uses public + hidden tests. For hidden cases the worker writes **only case number, verdict and runtime** to `submissions.results` — never the input, expected output or actual output. Public cases may include all three. Only "Case 7 failed: wrong answer" is shown for a hidden case.
- **Realtime relies on RLS:** `submissions` has an owner-only `SELECT` policy (`user_id = auth.uid()`), so a Realtime subscription can only ever receive the subscriber's own rows.
- Timeout: if no result after 20 s, the worker marks `status=error` and the UI offers "Try again" while keeping the code.

### 4.2 Code harness
Each problem has, per language, `starter_code` (what the user sees) and `harness_code` (hidden driver). The worker concatenates user code + harness and sends **one** Judge0 submission whose stdin holds every case input.

The harness, in one process:
1. Reads all case inputs from stdin.
2. For each case in order: checks the remaining overall time budget; if it is used up, stops and exits cleanly. Otherwise it calls the user's function, times the call itself, and prints **one JSON line** (`{"case":3,"ms":4,"output":…}` or `{"case":3,"error":"…"}`), flushing stdout immediately.
3. Lines carry a per-job nonce embedded in the harness source, so anything the user's code prints goes to console output instead of being read as a result.

The worker parses whatever lines arrived and compares each `output` with the expected output using the problem's comparator (`exact`, `float_tolerance`, `unordered`). **Expected outputs never leave the worker** — they are not sent to Judge0.

- **Time limits:** overall limit = per-case limit × case count, capped per problem (`problem_languages.max_total_ms`) and never above the Judge0 plan's maximum wall time.
- **Cases not run are reported as `not_run`, not lost.** If the budget runs out, or one case hangs and Judge0 kills the process, every printed case keeps its result. The case in flight when the process was killed gets `time_limit_exceeded`, and the rest get `not_run`.
- Runtime is measured per case by the harness. Memory is the peak for the whole run, as reported by Judge0.

### 4.3 Pro entitlement
- Razorpay → `POST /api/webhooks/razorpay` → verify signature → upsert `subscriptions` → recompute `entitlements` for the user.
- Every gated read (locked problem, solution tab, 30/60/90-day company lists) goes through a server helper `can(user, feature)` that reads `entitlements`.
- RLS on `editorials`, `problem_companies` (timeframe ≠ all) and Pro problems' `harness/test` data denies access without an active entitlement.

### 4.4 Learn and roadmap
- Lesson MDX → statically generated at build; `revalidate` on publish.
- Roadmap structure (`roadmap_layers`, `topics`, `topic_problems`) is in Postgres so ordering and the 70/30 free/Pro split can change without a deploy.
- Quiz answers and "lesson read" events → `user_topic_progress`.

### 4.5 Company data import
`scripts/data/import-companies.mjs` reads the company-wise CSVs → upserts `companies`, `problems` (status `pending`, metadata only) and `problem_companies` (frequency, timeframe). Idempotent; re-runnable when data updates.

### 4.6 Rooms (v1.1)
- `orgs` → `org_members` (owner/interviewer) → `rooms` → `room_problems` (from `problems` where `pool = 'room'`) → `room_candidates` (invite token) → `room_attempts` (code, verdicts, timings).
- Candidate workspace uses the same judge flow with `context = room` (no hints, no solutions, timer enforced server-side by `started_at + time_limit`).
- Plan limits (`candidates_per_month`) enforced when an invite is created.

### 4.7 Arena (later)
Socket.io on the engine, matchmaking queue in Redis, duel state machine `queued → matched → in_progress → finished`, ratings in Postgres. Nothing in v1.0 depends on it.

## 5. Data model (v1.0)

```mermaid
erDiagram
  profiles ||--o{ submissions : makes
  profiles ||--o{ user_problem_status : has
  profiles ||--o{ user_topic_progress : has
  profiles ||--o{ subscriptions : pays
  profiles ||--|| entitlements : gets
  tracks ||--o{ roadmap_layers : has
  roadmap_layers ||--o{ topics : has
  topics ||--o{ topic_problems : orders
  problems ||--o{ topic_problems : in
  problems ||--o{ problem_companies : asked_at
  companies ||--o{ problem_companies : asks
  problems ||--o{ problem_patterns : uses
  patterns ||--o{ problem_patterns : tags
  problems ||--o{ problem_languages : has
  problems ||--o{ test_cases : has
  problems ||--o{ hints : has
  problems ||--o| editorials : has
  problems ||--o{ submissions : receives
  topics ||--o{ quiz_questions : has
  profiles ||--o{ lists : owns
  lists ||--o{ list_items : contains
  study_plans ||--o{ study_plan_items : contains
```

| Table | Key columns | Notes |
| --- | --- | --- |
| profiles | id (= auth.users.id), name, avatar, college, target_role | Existing users kept; optional fields |
| tracks | id, slug, name, status (live/soon) | DSA, Patterns, SQL, HR, … |
| roadmap_layers | id, track_id, position, name | "Layer 1 · Foundations" |
| topics | id, layer_id, position, slug, name, icon_url, lesson_path, free_ratio (default 0.7) | lesson_path points to MDX |
| quiz_questions | id, topic_id, question, options jsonb, answer_index | 3 per topic |
| problems | id, slug, number, title, difficulty, category, statement_md, constraints jsonb, source (algogym/leetcode/gfg), source_ref, source_url, status (original/adapted/pending), pool (public/room), is_pro, comparator | |
| topic_problems | topic_id, problem_id, position | Roadmap order; Pro = position beyond free_ratio |
| companies / problem_companies | company: id, slug, name, logo_url · link: problem_id, company_id, frequency, timeframe (30/60/90/all) | |
| patterns / problem_patterns, tags / problem_tags | | |
| problem_languages | problem_id, lang, starter_code, harness_code, time_limit_ms (per case), max_total_ms, memory_kb | harness_code server-only |
| test_cases | id, problem_id, input, expected_output, is_hidden, position | Hidden rows: service role only |
| hints / editorials | problem_id, position, body_md · problem_id, body_md, solutions jsonb | Editorials gated by entitlement |
| submissions | id, user_id, problem_id, lang, code, mode (run/submit), context (practice/room), status, verdict, results jsonb, runtime_ms, memory_kb, created_at | Owner-only SELECT (RLS); hidden cases store case, verdict, runtime only; runs purged after 24 h |
| user_problem_status | user_id, problem_id, status (attempted/solved), solved_at | Drives ✓ and acceptance % |
| user_topic_progress | user_id, topic_id, lesson_read_at, quiz_passed_at, completed_at | Roadmap node states |
| notes / bookmarks | user_id, problem_id, body / created_at | |
| lists / list_items | id, user_id, name / list_id, problem_id | "My Lists" |
| daily_problems | date, problem_id | Daily calendar |
| study_plans / study_plan_items | id, slug, name, is_pro / plan_id, problem_id, module, position | |
| interview_items | id, kind (hr/sql), question, answer_md, companies[], roles[] | Migrated Interview Prep |
| subscriptions | id, user_id or org_id, plan, razorpay_sub_id, status, current_period_end | |
| entitlements | user_id, pro_until | Single source for gating |
| waitlist | id, email, user_id, feature ('arena') | |
| legacy.* | archived old tables | Read-only, kept for user data |

**v1.1 additions:** orgs, org_members, rooms, room_problems, room_candidates, room_attempts, room_usage (monthly counts).

## 6. API surface

### Next.js route handlers (`apps/web/app/api`)
| Method | Path | Purpose |
| --- | --- | --- |
| POST | /api/judge | Create run/submit, forward to engine |
| GET | /api/submissions/:id | Fallback polling if Realtime unavailable |
| POST/DELETE | /api/bookmarks, /api/notes, /api/lists, /api/lists/:id/items | User data |
| POST | /api/progress/lesson, /api/progress/quiz | Learn progress |
| POST | /api/waitlist | Arena waitlist |
| POST | /api/billing/checkout | Create Razorpay subscription |
| POST | /api/webhooks/razorpay | Payment events (signature verified) |
| GET | /api/health | Uptime check |

Reads for pages happen directly in Server Components (Supabase server client), not through public APIs.

### Engine (`apps/engine`)
| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | /v1/jobs | HMAC (shared secret, timestamp, 60 s window) | Enqueue a judge job for a submission id |
| GET | /v1/health | none | Railway health check |
| GET | /v1/metrics | token | Queue depth, Judge0 latency |

## 7. Security

| Threat | Control |
| --- | --- |
| Running untrusted code | Only inside Judge0 sandboxes; engine never executes user code |
| Leaking hidden tests | `test_cases.is_hidden` rows and `harness_code` readable only by service role; never selected in client queries; worker writes only case number + verdict + runtime for hidden cases; expected outputs never sent to Judge0 |
| Reading others' submissions | Owner-only `SELECT` RLS policy on `submissions`; Realtime subscriptions depend on it |
| Bypassing Pro | Server-side `can()` checks + RLS on gated tables; no client flags |
| Forged engine calls | HMAC with timestamp; engine not publicly documented; Railway private networking for Redis |
| Judge abuse / cost | Per-user limits in Redis (30 runs / 5 min, 10 submits / min), max code size 64 KB, max custom cases 5 |
| Payment fraud | Razorpay signature verification; idempotent webhook handling by event id |
| Secrets | Judge0 key and Supabase service key only on the engine/server; Vercel and Railway env vars |
| XSS in lessons/statements | MDX from repo only; statements sanitized Markdown; strict CSP |

## 8. Performance and caching
- Landing, pricing, Learn: static/ISR at the edge; cube loop served as WebM/MP4 from the CDN with a poster image.
- Problems list: server-rendered first page, client pagination; Postgres indexes on (category, difficulty), (company_id, timeframe, frequency), trigram index on title for search.
- Workspace: statement server-rendered; Monaco loaded client-side and lazily.
- Supabase in Mumbai (ap-south-1) and Railway in the closest region to India for low latency.

## 9. Environments and deployment

| Env | Web | Engine | DB |
| --- | --- | --- | --- |
| Local | `next dev` | `node --watch` + local Redis (Docker) | Supabase local (CLI) |
| Preview | Vercel preview per PR | Railway PR environment | Supabase branch |
| Production | Vercel production | Railway production | Supabase production |

- CI (GitHub Actions): typecheck, lint, Vitest, migration dry-run, content validator (every problem's tests pass against its reference solution in 4 languages), `npx impeccable detect apps/web/src` (UI anti-pattern check, see DESIGN.md §9).
- Icons: `devicon`, `simple-icons` and `lucide-react` pinned in package.json; no runtime icon CDN.
- Migrations: SQL files in `supabase/migrations` (repo root), additive only; destructive changes need a written plan and a backup.

## 10. Observability
- Sentry in web and engine (errors, slow transactions).
- PostHog events: signup, lesson_read, quiz_passed, run, submit, solved, upgrade_clicked, checkout_success, waitlist_joined.
- Engine metrics: queue depth, job duration, Judge0 error rate; alert if Judge0 errors > 5% for 5 minutes.

## 11. Migration from the current app
1. Freeze old features behind flags; ship clean-up on a branch.
2. Move old tables to the `legacy` schema (no drops); keep `profiles` and auth users.
3. Strip onboarding redirects from `src/proxy.ts`.
4. Migrate Interview Prep content into `interview_items`.
5. Create new tables; run CSV import and seed launch problems.
6. Turn on new UI; monitor; drop nothing until 30 days after launch, and only with sign-off.

## 12. Cost (to confirm)
Vercel, Supabase and Railway have paid plans that fit this scale; Judge0 RapidAPI pricing depends on request volume. Check current prices for each before launch and set a monthly budget (open question in the PRD).

## 13. Decisions and alternatives

| Decision | Chosen | Alternatives considered | Why |
| --- | --- | --- | --- |
| Backend shape | Next.js + one Express engine | Next.js only; full Express API | Vercel can't run queues/WebSockets; full API adds ~2 weeks with no mobile app planned |
| Judge | Hosted Judge0 | Self-hosted Judge0, Piston | Fastest to ship, sandboxing handled; swappable interface |
| Judge calls | One submission per Run/Submit, all cases in one harness process | One submission per test case (batch) | Per-case batches cost 12+ billed calls per Submit; see [DECISIONS.md](./DECISIONS.md) |
| Monorepo tooling | npm workspaces, `supabase/` at root | pnpm, migrations in `packages/db` | Keeps the lockfile and the Supabase CLI's migration ledger working |
| Result delivery | Supabase Realtime | Polling, Socket.io | No extra server for v1.0; polling fallback exists |
| Lessons | MDX in repo | Lessons in DB/CMS | Versioned, reviewable, static and SEO-friendly |
| Engine host | Railway | Render, VPS | Simple GitHub deploys, built-in Redis |
