# Symm AI deep-learning update (19 October 2026)

## Audit and root causes

- The prior roadmap prompt explicitly requested only 2–4 lesson titles per module; the lesson schema accepted two short sections and no worked example. That combination produced shallow content even with a capable model.
- The prior path request held the browser response until Gemini completed, then inserted modules and lessons in a sequential loop and requested recommendations for each module. Provider lookups were on the critical path to seeing the roadmap.
- JSON MIME mode alone did not keep Gemini inside the requested enum and string shapes. Live responses included object-valued questions and invalid language/category values. The updated requests send a JSON response schema and still validate with Zod before persistence.
- Previously, language was neither saved with the course nor passed to lesson and tutor generation.

The Socratic-AI source was reviewed for its staged course/lesson generation, lazy lesson enrichment, Markdown/LaTeX rendering, and knowledge checks. AlgoGym keeps its own Next.js, Supabase Auth, and Supabase database; no source code or separate Auth0/MongoDB stack was imported. Its MIT license is at https://github.com/someshsinha/Socratic-AI/blob/main/LICENSE. Interactive testing of its authenticated live app was not performed.

## Flow and data

1. The user selects C++17, Java 17, or Python 3 and submits a topic. The selection is saved on the new `ai_learning_paths` row and in a per-user browser preference for subsequent paths.
2. The server validates the request, reserves the existing quota, creates a path and an idempotent `ai_generation_jobs` row, and returns HTTP 202. Next.js `after()` starts the job; the protected existing cron endpoint can recover queued or stale jobs. The path screen polls its authorized status and offers bounded retry after failure.
3. The job requests only metadata and ordered lesson outlines, validates the JSON, then bulk-inserts modules and lessons. It marks the roadmap ready before best-effort prefetching of the first lesson. Competitive modules search the existing provider-backed problem catalog when opened, with a manual retry if that lookup fails.
4. Lessons generate independently when opened. Completed lesson content is stored in the existing JSONB column and reused after refresh. The new content contract includes a required worked example, 5–10 concept sections, questions, takeaways, and mistakes. When a validated lesson is under 900 words, a narrow second generation pass adds nonrepetitive reasoning sections. Expansion failure retains the validated base lesson.
5. Switching language keeps the roadmap and progress. The server checks ownership, saves the selected language, returns a cached variant if present, or generates and stores a new one in `ai_lesson_code_variants`. The tutor receives the selected language and a compact lesson summary.
6. Reading, generating and answering AI questions do not themselves issue Chakra. Existing verified provider solves and the authoritative ledger remain the source of rewards.

Migration `20261019010000_symm_deep_learning.sql` adds path language/prompt version, a private code-variant cache, and a private generation-job table. It enables ownership-aware read RLS and reserves writes for the server role. Existing paths default to C++ and existing lessons/progress remain intact. The linked production Supabase project accepted the additive migration after a CLI dry run showed it was the only pending migration.

## Measured live content checks

Using the configured server-side Gemini key and `gemini-3.5-flash-lite`, a Grid DP prompt produced six modules and 32 lesson outlines in 5.54 seconds. A generated Unique Paths lesson took 10.66 seconds in C++ (1,398 words), 10.12 seconds in Java (1,323 words), and 9.07 seconds in Python (1,112 words). Each passed the structured validation and contained code only in its selected language. The benchmark also checked Dijkstra (1,273 words), binary search on answer (1,056 words), and operating systems (1,199 words); each generated six or seven modules and passed targeted topic assertions. These are individual calls, not p75/p95 latency estimates. No valid before-change latency sample or 10/25/50-user load result is available, so no speedup or concurrency capacity is claimed.

The landing preview is a labeled, prepared product demonstration. It calls neither Gemini nor Supabase on passive interaction. Desktop 1440px and mobile 390px browser checks confirmed the headline, six roadmap nodes, language-switched code, and absence of horizontal overflow.
After commit `82e8312` reached Vercel, the production deployment was Ready; the live landing returned HTTP 200, the Symm health endpoint reported configured, and the same desktop/mobile preview checks passed against `https://algogym.vercel.app`.

## Limits and follow-up verification

- Authenticated path creation, background `after()` execution on Vercel, first-lesson prefetch, RLS across two test accounts, and code-variant cache reuse still need a real multi-account end-to-end check after deployment. Build and live provider tests do not prove those flows.
- The fallback cron schedule is daily on the current Vercel plan. An interrupted job can also be retried from the path screen; higher reliability under sustained load would require a more frequent authorized worker or managed queue.
- Generated code was checked for language consistency, not compiled or executed. No arbitrary generated code runs inside the Next.js process.
- LeetCode Chakra remains gated by the existing accepted-solve verification policy. External practice links come from the existing catalog and recommendation adapter, not from the language model.
- The user-shared Gemini key was exposed in chat and should be rotated in Google AI Studio and in local/Vercel environment settings.

## Reproduce checks

`npm run typecheck`, `npm run build`, and `npm test` cover local static and unit validation. The opt-in provider tests are `SYMM_LIVE_TEST=1 npm test -- server/symm-ai.live.spec.ts` and `SYMM_BENCHMARK=1 npm test -- server/symm-benchmark.live.spec.ts` with `GEMINI_API_KEY` supplied server-side. `node scripts/check-symm-showcase.mjs` checks the local development landing page on port 8080; set `ALGOGYM_TEST_URL=https://algogym.vercel.app` to check the deployed preview.
