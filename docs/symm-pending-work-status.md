# Symm pending work — 21 October 2026

Completed locally:
- Connected the existing credit indicator/dialog to home, library and roadmap views, including exhausted-credit handling.
- Preserved API error codes for UI handling.
- Added recovery of unsettled credits for ready, failed and deleted paths.
- Preserved saved roadmaps when accounting fails or a worker restarts after saving.
- Updated the pending migration to refund an outstanding failed attempt atomically before reserving a retry, resolving the fresh-context review finding.
- Background motion now pauses when the document is hidden and reports actual playback state while respecting reduced motion.

Verification: 79 unit tests passed; six opt-in live AI tests skipped. Typecheck and production build passed. The existing browser release check passed against an isolated production server: desktop/mobile, light/dark, yearly pricing toggle, unavailable checkout, intro video playback/seek and overflow. The existing development server check timed out on pricing interaction; the production rerun passed.

Remaining release gates: the new credit migration has not been applied or validated against a database in this session. `scripts/sql/ai-credit-retry-tests.sql` supplies a rollback-only staging regression for failed refund → retry → settlement, but has not been executed. Keep `SYMM_AI_CREDITS_ENABLED=false` until migration review, staging SQL/RLS/concurrency tests and recovery scheduler verification pass. Authenticated credit UI end-to-end acceptance remains pending. No production data or paid AI calls were used for this verification.
