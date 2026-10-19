# API surface

The Next.js route `src/app/api/[...path]/route.ts` dispatches GET, POST, and PATCH to `server/next-api/` modules. Those modules adapt requests to `server/api-handlers/`. Unknown paths return 404; unsupported methods return 405. Most application endpoints return JSON and require a Supabase session; authentication callbacks, public profile reads, and cron have their own rules. Input validation and error codes are defined by each handler, not by a generated OpenAPI contract.

| URL | Typical methods | Purpose / access |
| --- | --- | --- |
| `/api/auth/google`, `/api/auth/callback`, `/api/auth/email`, `/api/auth/session`, `/api/auth/signout` | GET/POST as dispatched | OAuth, email flows, session, sign-out |
| `/api/onboarding`, `/api/colleges` | GET/PATCH/POST | Authenticated onboarding and college search/request |
| `/api/account/profile`, `/api/profile-verification` | GET/POST/PATCH as dispatched | Own profile and provider ownership challenge |
| `/api/public-profile`, `/api/profile-card` | GET | Selected public profile or share-card data |
| `/api/providers/codeforces`, `/api/providers/leetcode/problems`, `/api/problem` | GET | Provider and problem discovery data |
| `/api/sync` | POST | Authenticated provider sync request |
| `/api/tracker`, `/api/statistics`, `/api/statistics/contest` | GET/POST as dispatched | Own solves and analytics |
| `/api/symm` | GET/POST | Authenticated action-based path, lesson, progress, tutor, and recommendation operations |
| `/api/societies`, `/api/societies/manage`, `/api/societies/invite`, `/api/societies/register` | GET/POST/PATCH as dispatched | Society discovery and role-checked mutations |
| `/api/leaderboards` | GET | Validated public ranking scopes and metrics |
| `/api/jobs/sync` | GET/POST | `Authorization: Bearer <CRON_SECRET>`; scheduled work |

`/api/symm` uses an `action` discriminator rather than separate versioned resource URLs. Supported actions in `server/api-handlers/symm.ts` include `path.generate`, `path.retry`, `path.delete`, `path.language`, `lesson.generate`, `code.variant`, `progress.complete`, `tutor.ask`, `module.recommend`, and `module.claim`. Consult its Zod schemas for exact bodies. New API work should not assume the aspirational `/api/v1/ai/*` paths exist.

Responses use HTTP status codes including 400 for validation, 401 for missing session, 403/404 for forbidden or unavailable resources, 409 for conflicting state, 429 for quotas, and 5xx for unavailable dependencies where applicable. The handler itself is authoritative for exact shape. Do not expose raw provider or Gemini credentials/errors in responses.
