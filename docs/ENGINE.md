# Engine runbook (`apps/engine`)

> **Not deployed for v1.0** (DECISIONS.md 2026-11-27). Run and Submit are judged by the Next.js `/api/judge` route calling OnlineCompiler.io directly. Don't create the Railway project below; this runbook stays for Rooms/Arena realtime in v1.1+.

## Judge setup for v1.0 (one-time, by the account owner)

1. Sign in at https://api.onlinecompiler.io (Google sign-in) and create a **REST API key**. The Free plan is enough to start: 100,000 runs a month, 60 a minute, 4 at once, no card. When busy it answers `429` at once and the user sees "the code runner is busy", with their code kept.
2. Add it as `CODE_RUNNER_KEY` in Vercel (Preview only until launch) and in `.env.staging.local` at the repo root. Never paste it into chat, code or a commit.
3. Optional `CODE_RUNNER_URL` overrides `https://api.onlinecompiler.io` (for a self-hosted runner with the same API).
4. Check: sign in on a preview, open any problem, press Run. The `submissions` row on staging should go `queued → running → done`.

Compilers used: `nodejs-24`, `python-3.14`, `g++-15` (C++17), `openjdk-25` (`packages/judge/src/onlinecompiler.mjs`).

The engine is the judge service from [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) §4 and §6. It has two processes built from one package:

| Process | Start | Does |
| --- | --- | --- |
| API | `npm start -w @algogym/engine` | `POST /v1/jobs` (HMAC-signed) queues a judge job in BullMQ. `GET /v1/health` checks Redis. |
| Worker | `npm run start:worker -w @algogym/engine` | Consumes the queue. In M10 it only logs; M11 adds the Judge0 call and result writes. |

## Local development

```bash
npm run build -w @algogym/engine     # tsc → apps/engine/dist
npm test -w @algogym/engine          # HMAC, validation and health tests; no Redis needed
REDIS_URL=redis://127.0.0.1:6379 ENGINE_HMAC_SECRET=<32+ chars> npm run engine:dev
```

You need a Redis 7 for the API to queue jobs (Docker: `docker run -p 6379:6379 redis:7`). Without one, the API still starts and answers `503` on `/v1/health` and `/v1/jobs`.

## Signing a request

```
x-algogym-timestamp: <unix seconds>
x-algogym-signature: hex(HMAC-SHA256(ENGINE_HMAC_SECRET, "<timestamp>.<raw body>"))
```

The engine rejects anything older or newer than 60 seconds, a body changed after signing, and a wrong or missing signature. All of these get the same `401`. The body is `{"submissionId": uuid, "userId": uuid, "mode": "run" | "submit"}` and the response is `202 {"jobId"}`. `jobId` equals `submissionId`, so a retried request never queues the same submission twice. The signing code is `apps/engine/src/hmac.ts`; `/api/judge` (M11) uses the same function.

## Railway setup (one-time, by the account owner)

Nothing here exists yet. Create, in this order:

1. **Account and project.** Sign up at railway.com and create an empty project named `algogym-engine`. Pick the region closest to India that Railway offers (Singapore, `asia-southeast1`).
2. **Redis.** In the project: *New → Database → Redis*. Railway creates a `Redis` service and its `REDIS_URL` variable. Keep it on the private network (no public TCP proxy needed).
3. **API service.** *New → GitHub repo →* `Symmetry7/AlgoGym`, branch `main`. In the service settings:
   - Root directory: leave empty (the repo root: the engine needs the workspace lockfile).
   - Config-as-code file path: `apps/engine/railway.json`. It sets the build and start commands and the `/v1/health` health check.
   - Variables:
     - `REDIS_URL` = `${{Redis.REDIS_URL}}` (a reference variable).
     - `ENGINE_HMAC_SECRET` = 64 random hex characters (`openssl rand -hex 32`).
     - `RAILPACK_NODE_VERSION` = `22`.
     - `NODE_ENV` = `production`.
   - Networking: *Generate domain*. That public URL becomes `ENGINE_URL` for the web app.
4. **Worker service.** Add the same repo again, named `worker`. Config file `apps/engine/railway.worker.json`, the same variables, and no public domain.
5. **Vercel.** Add `ENGINE_URL` (the API domain) and `ENGINE_HMAC_SECRET` (the same value) to the web project's Preview environment. Production waits for the M20 cutover.
6. **Check.** `curl https://<api-domain>/v1/health` should return `{"ok":true,"redis":"up"}`, and the API service shows "Healthy".

To rotate the secret, set the new value as `ENGINE_HMAC_SECRET` and the old one as `ENGINE_HMAC_SECRET_PREVIOUS`, deploy, move the web app to the new secret, then remove `ENGINE_HMAC_SECRET_PREVIOUS`.

## Environment

| Variable | Needed by | Notes |
| --- | --- | --- |
| `REDIS_URL` | API, worker | Railway reference variable |
| `ENGINE_HMAC_SECRET` | API | ≥ 32 characters, shared with the web app |
| `ENGINE_HMAC_SECRET_PREVIOUS` | API | Optional, only during rotation |
| `PORT` | API | Set by Railway |
| `JUDGE_QUEUE` | API, worker | Optional, default `judge` |
| `JUDGE0_*`, `SUPABASE_*` | worker | Added in M11 |
