# AlgoGym 2.0 Reconstruction Plan

## Overview

Reconstruct AlgoGym around the supplied PRD, architecture, API/database, and UI/UX documents while preserving current training behavior, account identity, and URLs where possible. The architecture decision log approves an incremental migration from Vite to Next.js App Router; compatible React, Tailwind, Radix, Supabase, and charting code should be reused.

## Decisions and guardrails

- Use Next.js App Router as approved in `architecture.md`; do not retain a second client router.
- Keep LeetCode Chakra awards disabled until the system can prove individual accepted submissions through a dependable, compliant integration.
- Never invent profiles, verification, awards, rankings, society approvals, or provider data. Use explicit unavailable, stale, pending, and empty states.
- Implement additive, reviewed SQL migrations locally. Do not deploy broader production schema changes without a backup and explicit migration review.
- Preserve existing account/session flow and user-owned coding-profile verification while moving Vite API handlers into Next.js route handlers.
- Use the documented conservative defaults: only newly verified eligible solves can earn Chakra; unverified historical activity earns nothing; private profile data defaults to private; society rankings disclose their proposed minimum and denominator.
- No hosted judge, messaging/feed, payments, subscription, streak multipliers, or unrelated features.

## Dependency order

1. Framework shell, design tokens, route compatibility, and server-managed Google sessions.
2. Shared typed API/data access and additive database migration.
3. Verified identity/settings and reusable application shell.
4. Problem discovery, curated training, and dashboard backed by current provider data.
5. Codeforces ingestion and transactional Chakra ledger; keep unsupported LeetCode rewards off.
6. Statistics, fair leaderboards, societies, profiles, and permission-gated management/admin screens.
7. Route parity, security/accessibility review, typecheck, tests, lint, production build, and responsive review.

## Risks and constraints

- Existing production schema and user data must be audited before broader migrations or backfills. The current repository includes only the account-verification migration and existing browser-backed training behavior.
- LeetCode profile ownership proof and individual solve ingestion have separate support gates; public aggregate counts are not solve evidence.
- The supplied society thresholds, transfer cooldown, public profile visibility, and Chakra eligibility choices are proposals. Implement them as documented, transparent defaults that can be changed by policy rather than silently presented as provider facts.
- Full production OAuth, migration, and background-sync acceptance requires project credentials and a staging environment; do not claim it from local compilation alone.

## Task list

See `tasks/todo.md` for implementation slices and completion checkpoints.

## Repair brief update — 17 October 2026

The latest request supersedes Google-only sign-in and the forced landing-page modal: support Google plus Supabase email/password, a public home page, resumable profile/college/platform/community onboarding, and server-authoritative practice and rewards. Preserve the supplied Chakra ranges with no award above 3500. Existing database ownership-verification tables remain canonical; extend rather than replace them.

Execute eight checkpoints in order: (1) reproduce auth/training/build errors, (2) repair cookies, callbacks, recovery and redirects, (3) public landing and resumable onboarding, (4) normalized college search and missing-institution requests, (5) provider adapters, durable sync and atomic rewards, (6) analytics, dashboard/profile and problem/training views, (7) society review and metric-specific leaderboards, (8) security, browser and release validation. Every checkpoint records actual test evidence and external configuration gates; compilation alone is never end-to-end acceptance.

Current audit findings: global auth gating hides the public home and public profiles; username hashes fabricate solve indicators; Set persistence loses training completion data; timer persistence is not based on elapsed wall time; training success toasts disagree with stored score; session endpoint masks configuration/network failure as signed-out state; core migration has not been applied; Supabase connector identity does not expose the configured project; provider statistics and rating-history calls need server-side normalization and capability flags.
