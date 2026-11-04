# Symm AI and Training Gym

## What is implemented

- `/training` keeps the existing verified Codeforces tracks, timer, sync action, and Chakra ledger. It now introduces Symm AI as an entry point.
- `/training/symm` is a dedicated, chat-first learning page inspired by the supplied Master reference. It requests a topic, current level, goal and available time; lists saved paths.
- `/training/symm/[id]` displays ordered modules, lazily generated lessons, Math/Markdown/code, persistent completion, attributed CP practice links and a lesson-aware Socratic tutor.
- The redesigned home uses a compact prompt composer, editable preferences and searchable library with real module and completion counts. The course view separates the overview roadmap from a reading workspace with collapsible curriculum and tutor panels. Lessons prepare on selection, save once generated, and keep the learner in place after completion until they choose **Next lesson**.
- Lesson code uses syntax highlighting, line numbers and copy. Grid lessons can show a path-counting diagram. Knowledge-check answers are sent to the contextual tutor, and generated common mistakes appear when available.
- Users can explicitly create another version of a path while retaining the original. Course deletion requires confirmation; the API checks ownership.
- Learning data lives in Supabase tables created by `20261018040000_symm_ai.sql`; lesson feedback uses `20261018050000_symm_content_reports.sql`; competitive module awards use `20261018060000_symm_module_awards.sql`. All have owner-only read policies. Mutations are server-authorized. The quota function limits roadmaps, lessons and tutor turns per user per day.
- AI responses are generated server-side through Gemini REST, parsed with bounded Zod schemas, and saved only after validation. Provider problem links use the official Codeforces catalog or existing catalog rows; AI cannot invent problem URLs.
- Students can report a generated lesson's quality; reports are persisted for review without editing the lesson.
- A lesson completion never awards Chakra. A completed competitive module earns 25 Chakra once only when every lesson is complete and at least one new recommended problem has an eligible provider-verified accepted solve with a normal Chakra award. The same solve cannot fund two module bonuses. The claim function writes the module award and Chakra ledger atomically. General learning paths do not earn competitive Chakra.
- The geometric `ChakraMark` is reusable and appears in Training Gym, dashboard, statistics, problem detail and profile.

## External configuration

Set `GEMINI_API_KEY` in `.env.local` for local development and the hosting provider's **server** environment for production. `GEMINI_MODEL` optionally overrides the default `gemini-3.5-flash-lite`. Never prefix this key with `NEXT_PUBLIC_` or `VITE_`.

The supplied Gemini key is configured locally in the ignored `.env.local` file. A live service test generated and validated a competitive roadmap, lesson and contextual tutor reply with `gemini-3.5-flash-lite`. The key has not been added to the hosting provider's environment. The user exposed this key in chat and a screenshot, so rotate it before production deployment.

## Integration boundaries

- Socratic-AI's MIT-licensed [repository](https://github.com/someshsinha/Socratic-AI) informed roadmap-first and lazy-lesson behavior. No source code was copied. Auth0, MongoDB and the Vite app were not imported.
- CP recommendations use Codeforces official catalog data and existing LeetCode problem records when those records have reliable metadata. Missing matches show an empty state with a retry action. [USACO Guide](https://usaco.guide/) and [YouKn0wWho Academy](https://youkn0wwho.academy/topic-list) are attributed external learning resources, not copied lesson content.
- The existing reward policy remains unchanged. LeetCode Chakra rewards are still inactive because individual accepted submissions are not reliably verified by the current integration.

## Verification

- Rollback transaction of migration and RLS assertions: passed.
- Linked Supabase migration dry runs: only the three new migrations pending at their respective steps.
- Linked Supabase migration pushes: the original three Symm AI migrations applied.
- `20261018070000_symm_path_deletion.sql` permits deleting a course after a module reward while retaining the award and one-solve-one-bonus constraint. Applied to the linked project; a read-only database query confirmed the nullable module reference and `ON DELETE SET NULL` action.
- Rollback-only module award flow: successful claim, duplicate claim, unfinished lesson and cross-user claim checks passed with an existing user and active reward policy.
- `npm run typecheck`, `npm run build`, `npm test` (46 tests): passed at implementation time.
- Live Gemini competitive roadmap, lesson and tutor generation, a general computer-science roadmap, and an adjacency-list lesson against `gemini-3.5-flash-lite`: 3 passed.
- Live route `/training/symm` returned HTTP 200; unauthenticated `/api/symm` returned HTTP 401.

## Pending validation

With an authenticated account, generate one CP and one general path through the UI, open a lesson, test tutor follow-up, refresh to confirm persistence, and verify that Codeforces recommendations open real problems. Complete an eligible Codeforces solve in a linked account and synchronize to validate Chakra separately. These browser journeys require an authenticated interactive session and were not executed by the service-level live test.
