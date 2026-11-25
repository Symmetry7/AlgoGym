# Algogym repository instructions

Algogym is an interview-preparation platform for students and developers in India: roadmaps with free lessons, original problems solved in an in-browser workspace (Judge0), company prep, Student Pro, and interviewer Rooms in v1.1. Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 3, Supabase (Postgres, Auth, Realtime), Vercel, plus an Express "engine" service for judging.

## Source of truth

[docs/PRD.md](docs/PRD.md), [docs/SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md), [docs/DESIGN.md](docs/DESIGN.md), [docs/BUILD_GUIDE.md](docs/BUILD_GUIDE.md) and [docs/DECISIONS.md](docs/DECISIONS.md). Content rules: [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md). When they disagree, the newest DECISIONS.md entry wins. Record every new decision there.

## Quality bar (standing rules)

1. This is a complete, production-grade product, not an MVP demo. Every screen ships with real states: loading, empty, error, locked, mobile (375 px) and keyboard.
2. Marketing pages match Resend's level of polish (DESIGN.md §6.1–6.2). The logged-in app follows TensorTonic's structure (roadmap path, split-pane workspace). The problems list follows the LeetCode-style layout in PRD §7.5.
3. The learning path is the core feature: a full 3D-style roadmap with every node, lesson and quiz wired to real progress. No placeholder nodes at launch.
4. Content is never thin: each launch problem has a statement, examples, hints, 10+ hidden tests, an editorial and solutions in 4 languages, validated in CI.
5. Every UI change passes the Impeccable gate (DESIGN.md §9) and is checked at 375 px and 1440 px before it's called done.
6. Source of truth: the five docs above.

## How work ships

- One milestone at a time, in BUILD_GUIDE.md order. Each one merges to `main` when done; `main` deploys previews only.
- Production serves the legacy app from `release/legacy` until the launch cutover (M20). Don't commit to that branch.
- Migrations go in `supabase/migrations/` and are **additive only until launch**: the legacy app shares the database.
- Before calling work done, run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` and `npm run design:check`. New tests go beside the code as `.spec.ts(x)`.
- Never commit `.env*` files or secrets.

## Where code lives

- `apps/web/`: the Next.js app (npm workspace). Run commands from the repo root; they forward to it. Local env files stay at the repo root.
- `apps/web/src/app/`: routes. `apps/web/src/components/shell/`: design-system primitives and app/marketing shells (tokens in `apps/web/src/styles/tokens.css`, prefixed `--ag-`).
- `apps/web/server/`: business logic and `/api/*` handlers. The server is authoritative for auth, Pro entitlements and judge results. Never rely on hidden UI to protect content.
- `content/problems/`, `content/learn/`: problems and lessons as files (see CONTENT_GUIDE.md). Playable problems are Algogym originals only.
- `supabase/`: migrations (source of truth) and Edge Functions. Don't infer live database state from migration files; use `supabase migration list --linked`.
- `scripts/{qa,data,ops,lib,sql}/`: QA checks, imports, setup and helpers. `docs/`: all documentation.
