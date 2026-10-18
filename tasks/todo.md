# AlgoGym rebuild status

## Implemented in this workspace

- Next.js App Router foundation with compatibility routes and the existing Google/Supabase session and profile verification flow.
- Minimal dark application shell and responsive navigation based on the supplied AlgoGym screens.
- Live problem catalog integrations for Codeforces and LeetCode, with provider calls on the server and explicit empty/error states.
- Dashboard, training, statistics, society directory and join requests, society moderation routes, leaderboards, profile privacy settings, and public profile surfaces.
- Additive database migration for core profiles, societies, membership review, verified activity/reward data, and leaderboards.
- Typecheck, unit tests, and production build pass.

## Remaining release gates

- Apply the additive Supabase migration only after the project owner reviews it and confirms production backup/safety. The current environment has no usable Supabase CLI session.
- Configure and verify Google OAuth redirect URLs and provider credentials in the target Supabase project.
- Add durable Codeforces sync and idempotent Chakra award processing; Chakra values remain intentionally unavailable until this exists.
- LeetCode ownership verification and per-problem solve proof remain capability-gated where public profile data cannot be reliably read.
- Complete admin operations, saved society/college leaderboards, and remaining product routes after their data and authorization contracts are available.
- Run an authenticated end-to-end verification with real test accounts after OAuth and migration setup.
