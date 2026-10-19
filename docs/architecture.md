# Architecture

This document describes the checked-in implementation. Proposed changes are identified at the end.

## System boundaries

AlgoGym is a Next.js App Router application hosted on Vercel. Pages under `src/app` render screens from `src/screens` and `src/features`. One catch-all App Router handler dispatches existing API URLs to `server/next-api`, which adapts requests to `server/api-handlers`. Supabase Auth supplies identity and PostgreSQL stores application state. External APIs are called from server code. The browser does not receive Gemini or service-role credentials.

```mermaid
flowchart LR
  subgraph Browser[User browser]
    UI[React screens]
  end
  subgraph Vercel[Next.js on Vercel]
    Pages[App Router pages]
    Proxy[Session refresh proxy]
    Dispatch[API dispatch]
    Services[Business and job services]
  end
  subgraph Supabase[Supabase project]
    Auth[Auth]
    DB[(PostgreSQL and RLS)]
    Edge[Verification Edge Function]
  end
  UI --> Pages
  UI --> Dispatch
  Pages --> Proxy
  Dispatch --> Services
  Proxy --> Auth
  Services --> Auth
  Services --> DB
  Services --> Edge
  Services --> CF[Codeforces]
  Services --> LC[LeetCode public GraphQL]
  Services --> Gemini[Gemini API]
  Cron[Vercel daily cron] --> Dispatch
```

The single API dispatcher is an explicit Vercel Hobby function-count trade-off. Individual handlers retain their own validation and authorization. `src/index.css` is loaded by the root layout; Tailwind and shared UI primitives provide styling. Client session state lives in `AuthContext`; hooks fetch data for screens. There is no separate Redux store.

## Authentication and request flow

`server/api-handlers/auth/google.ts` initiates Supabase Google PKCE OAuth; callback handling establishes cookies. Email/password, confirmation, recovery, and sign-out are also implemented. `src/proxy.ts` refreshes Supabase cookies. Protected handlers call the authenticated user check and enforce resource ownership; service-role access is confined to server modules. Database RLS is a second boundary.

```mermaid
sequenceDiagram
  actor User
  participant Web as Browser/Next.js
  participant API as Auth API
  participant Auth as Supabase Auth
  participant DB as PostgreSQL/RLS
  User->>Web: Choose Google or email sign-in
  Web->>API: Start authentication
  API->>Auth: PKCE redirect or credential request
  Auth-->>API: Session / callback result
  API-->>Web: Secure session cookies
  User->>Web: Open protected feature
  Web->>API: Request with cookies
  API->>Auth: getUser and verify session
  Auth-->>API: User identity
  API->>DB: Owned query or authorized RPC
  DB-->>API: RLS-scoped data
  API-->>Web: Response
```

See [authentication](authentication.md) for redirect and authorization details.

## Provider linking and synchronization

Ownership verification and activity synchronization are distinct. The server issues a short-lived, hashed challenge for a canonical handle; a provider-specific public field is checked before linking. Codeforces and LeetCode sync paths then collect different kinds of data. `sync_jobs` is the durable queue, with database RPCs for enqueue/lease and `server/sync-worker.ts` for execution. The daily cron enqueues due profiles and processes a bounded batch; an authorized user request can also start processing through Next.js `after()`.

```mermaid
flowchart LR
  Link[User links handle] --> Challenge[Server issues ownership challenge]
  Challenge --> PublicField[User updates provider public field]
  PublicField --> Verify[Provider-specific verification]
  Verify --> Profile[(coding_profiles)]
  Profile --> Enqueue[(sync_jobs)]
  Cron[Daily cron] --> Enqueue
  Enqueue --> Worker[In-request sync worker]
  Worker --> Provider[Provider API]
  Provider --> Normalize[Normalize public data]
  Normalize --> Snapshot[(snapshots, submissions, ratings)]
  Snapshot --> Award[Codeforces verified-solve RPC]
```

Codeforces offers rating and accepted-submission evidence. LeetCode synchronization currently stores public aggregates, not individual accepted proofs. Other provider connections do not imply a full submission sync. See [integrations](integrations.md).

## Rewards

Codeforces submission ingestion calls a database award RPC. SQL policies map problem ratings to points, reject duplicates, and update `chakra_awards`, `chakra_ledger`, and `chakra_balance_cache` transactionally. A separate Symm AI competitive-module RPC requires every lesson complete plus a **new eligible verified recommended solve** and has its own uniqueness constraints. Lesson completion alone is not rewarded.

```mermaid
flowchart LR
  CF[Codeforces accepted submission] --> Persist[(provider_submissions and solves)]
  Persist --> Eligibility[Provider evidence and policy eligibility]
  Eligibility --> Unique[Unique award / transaction checks]
  Unique --> Awards[(chakra_awards)]
  Awards --> Ledger[(chakra_ledger)]
  Ledger --> Balance[(chakra_balance_cache)]
  Persist --> Module[Optional competitive module claim]
  Module --> LessonCheck[All lessons and new eligible solve]
  LessonCheck --> ModuleAward[(ai_module_awards and ledger)]
```

The recent retroactive-award migration changes some historical eligibility. Read [Chakra](chakra.md) and the migration before changing reward code.

## Symm AI

`server/symm-ai.ts` calls Gemini with structured output validation. `server/api-handlers/symm.ts` authenticates, applies quotas, checks path ownership, and persists modules and progress. Curriculum creation returns a roadmap before detailed lessons are generated. `ai_generation_jobs` and events track durable status; `server/symm-jobs.ts` runs or recovers work from requests and the daily cron. Lessons and code variants are cached in PostgreSQL. Tutor calls receive selected course/lesson context and recent conversation history.

```mermaid
flowchart LR
  Prompt[Prompt and preferences] --> Validate[Auth, quota, input validation]
  Validate --> Job[(ai_generation_jobs)]
  Job --> Gemini[Gemini structured curriculum]
  Gemini --> Schema[Schema validation]
  Schema --> Path[(Path, modules, lesson outlines)]
  Path --> Open[Open a lesson]
  Open --> Cache{Content cached?}
  Cache -- Yes --> Lesson[Render lesson]
  Cache -- No --> Detail[Generate and persist lesson]
  Detail --> Lesson
  Lesson --> Variant[Language variant on demand]
  Lesson --> Tutor[Contextual tutor and progress]
  Cron[Daily recovery] --> Job
```

These are database-backed jobs executed inside Next.js requests. There is no continuously running worker or streaming queue. See [Symm AI](symm-ai.md).

## Database relationships

The complete schema is migration-defined. Core relationships are summarized here; `auth.users` is managed by Supabase Auth.

```mermaid
erDiagram
  USERS ||--|| PROFILES : has
  USERS ||--o{ CODING_PROFILES : links
  USERS ||--o{ SOLVES : owns
  USERS ||--o{ AI_LEARNING_PATHS : creates
  COLLEGES ||--o{ SOCIETIES : hosts
  SOCIETIES ||--o{ MEMBERSHIPS : contains
  USERS ||--o{ MEMBERSHIPS : joins
  PROBLEMS ||--o{ SOLVES : solved_as
  SOLVES ||--o| CHAKRA_AWARDS : earns
  USERS ||--o{ CHAKRA_LEDGER : owns
  AI_LEARNING_PATHS ||--o{ AI_LEARNING_MODULES : orders
  AI_LEARNING_MODULES ||--o{ AI_LEARNING_LESSONS : contains
  AI_LEARNING_LESSONS ||--o{ AI_LEARNING_PROGRESS : records
  AI_LEARNING_LESSONS ||--o{ AI_LESSON_CODE_VARIANTS : has
```

Indexes include owner/recent lookups, module and lesson ordering, active-job partial indexes, and uniqueness for solve rewards and memberships. Ownership RLS policies protect AI records; server-side service-role queries repeat ownership checks. See [database](database.md).

## Communities and leaderboards

`colleges`, `societies`, `memberships`, invitations, and applications define community membership. Database functions enforce competitive membership rules and society roles. `server/api-handlers/leaderboards.ts` accepts a validated scope and metric, then calls `read_leaderboard`; ranking eligibility lives in SQL migrations. There is no Redis ranking cache. Snapshots and entries in PostgreSQL support ranking reads.

## Jobs, deployment, and recovery

`vercel.json` invokes `/api/jobs/sync` daily. That endpoint requires `CRON_SECRET`, enqueues due profile syncs, processes a bounded batch, and recovers Symm AI path jobs. User requests can initiate bounded work through Next.js `after()`. Jobs track status and retries in PostgreSQL; uniqueness and lease mechanisms reduce duplicate execution. A serverless invocation can time out, so remaining work depends on later requests or cron. Logs and database job status are the operational evidence; no dedicated worker or Redis is deployed.

## Security boundaries

Browser input is validated in handlers, session identity comes from Supabase Auth, and RLS protects direct database access. `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, and `CRON_SECRET` remain server-only. Provider profile fields and generated AI content are untrusted input. The UI renders Markdown through React tooling rather than injecting arbitrary HTML. Provider evidence, not a client click, is required for solve awards.

## Current trade-offs and possible evolution

The one-function API dispatch and request-executed jobs fit the current deployment but constrain concurrency and long generation. A provisioned worker/queue, shorter cron interval, deeper monitoring, and cache could improve throughput after measurement. Redis and an independent authentication service are proposals only. No performance or production scalability benchmark is claimed.
