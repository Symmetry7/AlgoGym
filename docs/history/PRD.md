# AlgoGym product requirements — recording addendum

Read with `AlgoGym_2.0_PRD.md`, `api-and-database-design.md`, and `VIDEO_FEATURE_MAP.md`. The recording extends the earlier scope with a durable personal question workspace, notes, sheets, contest calendar, portfolio sharing, and country-scoped discovery. The supplied AlgoGym logo stays canonical. The latest recording guides product structure; existing working authentication and Chakra rules remain authoritative.

## Audience and repeat journey

Students and competitive programmers connect accounts, inspect verified progress, save practice questions with notes, organize/follow sheets, revise, find upcoming contests, and compare progress within their college/community. Saving or manually completing a workspace item is personal study state, not proof of an accepted submission.

## Priorities

- **P0:** real Google/email sessions, resumable onboarding; working persisted workspace/search/filter/favorites; question/general notes; custom/followed/shared sheets; actual CF/LC portfolio; metric/scope leaderboards; cached contest calendar and subscriptions; profile settings/privacy; complete navigation and logout.
- **P1:** validation, RLS/account isolation, keyboard/mobile behavior, retry/empty/loading, revision selection after 20 completed study items, user-owned share card, current-user ranking, tested sync/rewards.
- **P2/external gates:** additional provider adapters, GitHub ownership/configuration and public analytics, approved company-question source, payment provider and lawful company-kit content, reliable reminder delivery. Keep these accounted for without simulated production functionality.

## Acceptance

Every feature has action → validated server operation → persisted state → feedback. Revisit/refresh restores state; another user cannot read/write private data. Public pages expose only opted-in fields. Rankings disclose metric, eligible population and freshness. Provider limitations remain visible. Completion is tracked feature by feature in the video map; compilation is not end-to-end acceptance.

## Superseding requirements — October 18
Societies are self-service: any authenticated user may create one immediately, with name required and college/description optional. No evidence URL or review is required. Shareable persistent invite links and QR codes allow immediate authenticated joining; suspended members remain restricted. Multiple groups are permitted while the existing single competitive membership policy remains. CP duels are deferred to v2.
Coding profile ownership challenges now cover Codeforces, LeetCode, CodeChef, AtCoder, GitHub and GeeksforGeeks. Statistics synchronization remains limited to Codeforces and LeetCode. A successful external ownership journey requires the account owner to publish their active challenge; adapter availability is not proof that a particular account is owned.
