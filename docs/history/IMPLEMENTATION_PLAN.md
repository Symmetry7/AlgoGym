# Recording implementation plan

## Checkpoint 0 — evidence and inventory

- [x] Locate local recording, read duration/resolution, inspect beginning through end, capture significant full-resolution screens.
- [x] Map observed interactions, promotional previews, assumptions and external gates in `VIDEO_FEATURE_MAP.md`.
- [x] Preserve existing requirement/architecture documents; add concise recording addenda.

## Dependency order and verification

1. **Finish foundation:** clear build/runtime warnings, review and apply additive submission migration, deploy atomic verification function; audit real auth callbacks/config; smoke email/session/own RLS. Existing data and private backup remain intact.
2. **Workspace vertical slice:** inspect/reuse training_lists/items; add private question state and general/question notes; validated add/edit/delete/star/filter/sort; dashboard actual totals; browser refresh and cross-user denial.
3. **Sheets vertical slice:** own sheet CRUD/items, discoverable approved/public sheets, follow/unfollow, read-only sharing and explicit collaborator roles; source attribution; progress from personal study states versus verified solves clearly separated.
4. **Contest calendar:** official CF adapter first, cached month/week/day/list and date/platform/search controls; authenticated subscriptions/counts and iCalendar export. Other schedules require a dependable source.
5. **Portfolio:** tracker-backed identity/privacy editing, heatmap/date control, separate ratings/distributions/topics/contests, verified links, safe refresh, shareable own card; empty/loading/error and private public-profile API checks.
6. **Leaderboards/communities:** server computed opt-in metric-specific snapshots, top three/current-user rank; country and canonical college filters; normalized society population, authorized membership/registration review.
7. **Remaining recording capabilities:** GitHub projects/analytics ownership, company catalog/source and payment/reminder external boundaries. Record exact unavailable configuration; never mark an integration complete without evidence.
8. **Release gate:** update feature map with exact tests/screens, run unit/integration/typecheck/build (lint if configured), isolated desktop/mobile keyboard journeys, account-switch isolation, provider failure/reward replay tests. Document production secrets/scheduler/interactive OAuth gates.

## Current evidence

- 34 unit tests across ten files and TypeScript passed. Production build passed with all routes; no lint script is configured.
- Desktop/mobile hero, actual Blender GLB rendering, motion advancement, pause/resume, reduced-motion still and browser exceptions passed eight assertions. The supplied short visual recordings were reviewed and mapped in `VIDEO_FEATURE_MAP.md`.
- Live confirmation/recovery/session/password replacement/token replay/origin/logout checks passed 14 assertions using a removed temporary identity. Email inbox delivery and interactive Google completion are not established by those checks.
- Live workspace/sheets/notes/privacy/card/calendar/rankings authorization plus desktop/mobile browser regression passed 31 assertions using two removed temporary identities.
- All seven reviewed additive migrations through `20261017122153_rankings_and_community_review.sql` are applied after transactional tests. The atomic ownership-verification function is deployed; it validates users internally even though gateway JWT validation is disabled for compatibility.
- Existing verified accounts synchronized real CF/LC evidence: 444 submission attempts, 339 unique accepted solves and 16 rating rows at that checkpoint. Historical ingestion awarded zero Chakra.
- Remote Supabase site/redirect URLs were repaired with a reviewed two-field configuration change. Provider credentials and unrelated settings were preserved.
- Canonical college directory has 71,238 imported institutions. The user-suggested hosted API was checked but currently returns null/empty records; it is documented rather than made a runtime dependency.
- The explicitly authorized initial administrator account has not registered in the configured project, so its role remains unassigned. Actual production frontend deployment, production secrets/scheduler invocation, interactive Google acceptance, and a real newly eligible reward solve remain release gates.

Do not interpret these checkpoints as full product completion.

## October 18 update
The latest society requirement supersedes the original review-based registration flow: immediate self-service creation and joining are implemented with persistent invite links and server-generated QR images. No public evidence URL or approval is required for new societies. Existing moderation and restricted competitive membership rules remain. Duels are reserved for v2.
All six providers have ownership challenge adapters; only Codeforces/LeetCode have statistics synchronization. Live challenge generation and negative verification checks pass for the four added providers. External profile owner edits are still required to prove successful end-to-end verification; no mock success is used.

Latest integration result: 27 API/browser assertions passed, including signed-out invitation → email login → return to invitation → join → browser refresh. Temporary accounts and societies were removed. Five-width landing layout checks passed (32 assertions). No lint script is configured. Successful external profile edits and interactive Google login remain manual acceptance checks.
