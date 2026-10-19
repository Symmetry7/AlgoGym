# Symm AI

**Learn competitive programming from first principles.** Symm AI accepts an educational topic, level, goal, study time, and preferred code language. It supports general technical subjects; problem recommendations are relevant mainly to DSA and competitive programming.

## Current pipeline

1. `server/api-handlers/symm.ts` authenticates the user, validates the action with Zod, applies generation quotas, and checks ownership.
2. `server/symm-jobs.ts` records a path-generation job in `ai_generation_jobs`; Next.js request execution and cron recovery process it.
3. `server/symm-ai.ts` calls Gemini using the server-only `GEMINI_API_KEY` and validates structured output before persistence.
4. Path metadata, ordered modules, and lesson outlines are stored in `ai_learning_paths`, `ai_learning_modules`, and `ai_learning_lessons`.
5. Detailed lessons are generated on demand and saved. The UI can reuse ready content after refresh.
6. C++17, Java 17, and Python 3 code variants are generated as needed and stored in `ai_lesson_code_variants`; switching language retains the path and progress.
7. The tutor receives the current course/lesson context and recent conversation state. Progress, conversations, recommendations, and reports persist in owner-scoped tables.

The client lives in `src/features/symm-ai/`; route wrappers are under `src/app/training/symm/`. The server services are in `server/symm-ai.ts`, `server/symm-jobs.ts`, and `server/symm-recommend.ts`. The API is the action-based `/api/symm`, not a deployed `/api/v1/ai/*` family. Content uses Markdown, KaTeX, and code highlighting in the lesson workspace.

The curriculum and lesson calls are independent, avoiding full-course generation in one request. Jobs have status and recovery paths, but work is still executed inside bounded Next.js invocations. The daily cron is the only scheduled recovery trigger. There is no dedicated worker, Redis cache, or guaranteed sub-second queue pickup. Gemini availability and output quality vary; schema validation does not prove factual or code correctness. Live benchmark tests exist but are opt-in and should not be run against production user data.

Competitive modules can recommend real catalog problems. Lesson completion updates learning progress only. A module bonus requires all lessons complete **and** a new eligible verified recommended solve, enforced by `claim_symm_module_award`; see [Chakra](chakra.md). General courses do not receive that award.

To diagnose a stuck path, inspect the authenticated `/api/symm` status response, `ai_generation_jobs` and events, the cron invocation, and Vercel logs without exposing prompt content or credentials. A failed generation can be retried through the existing action. A future dedicated queue/worker may improve latency, but is not deployed.
