# AlgoGym 3.0 validation log

## Local implementation snapshot — 21 October 2026

Production build passed with `/pricing`, `/resources`, and `/upsolve` included.
TypeScript passed. Unit tests: 50 passed, 6 opt-in live tests skipped.
Unauthenticated `/api/upsolve` returned HTTP 401.

Public browser checks covered landing and pricing at 1440 × 900 and pricing
at 390 × 844. No horizontal overflow was observed. The Symm showcase follows
the hero. These checks do not establish authenticated-flow coverage.

Follow-up pricing checks covered light and dark at 1440 × 900 and 390 × 900.
Both rendered without horizontal overflow and retained disabled paid CTAs.
The annual toggle did not respond in the local development browser. Scripts
returned HTTP 200, but React instance properties were absent on the controls.
Hydration remains an open investigation; pricing interaction is not a pass.
TypeScript passed after the theme and Supabase environment-template changes.

## Live Gemini samples

Each sample requested Grid DP curriculum and a Unique Paths lesson. No user
records were written by this benchmark.

| Language | Curriculum | Modules / lessons | Detailed lesson | Words | Code blocks |
|---|---:|---:|---:|---:|---:|
| C++ | 5,282 ms | 5 / 25 | 10,727 ms | 1,393 | 2 |
| Java | 9,014 ms | 6 / 30 | 16,447 ms | 1,531 | 2 |
| Python | 6,600 ms | 6 / 31 | 16,732 ms | 1,456 | 2 |

Schema and language checks passed. These are individual observations, not
percentiles, concurrency tests, or before/after measurements. Generated code
was not compiled or executed; factual correctness still needs educator review.

The shallow-content fix removes a section-count shortcut that previously
accepted ten short sections without expanding an under-length lesson.

## Release gates still open

- The target Supabase project is not visible in the connected account. The
  credit migration is prepared only, not applied or integration-tested.
- Credit functions are not yet connected to production generation. No new
  credit deductions or signup grants are active.
- No active Stripe account exists. Pricing is explicitly a preview, and paid
  checkout is disabled. No paid entitlement is granted from client state.
- Mentor session format is confirmed; availability, Q&A limits and terms are
  still needed before selling access.
- No product introduction video has been generated.
- A capture storyboard and optional Higgsfield transition prompt are prepared
  in [symm-video-production.md](symm-video-production.md). Catalog discovery
  succeeded; no paid generation was submitted.
- Complete authenticated browser, theme, billing, database concurrency and
  cross-user authorization coverage remains outstanding.

## Follow-up: navigation and pricing

- Added a collapsible Symm navigation rail, recent saved paths, library search,
  settings, appearance control and a mobile drawer. The sidebar uses the existing
  authenticated path response; no new persistence or authentication system.
- Added a horizontally scrollable, accessible pricing comparison. All paid
  benefits remain explicitly described as a preview.
- Excluded all `/_next/` internals from the session-refresh proxy. A regression
  test failed for `/_next/hmr` before the change and passed afterward.
- Fresh results: TypeScript passed; production build passed; unit suite
  **62 passed, 6 opt-in live tests skipped**.
- The production browser passed the annual price toggle and both themes at
  desktop/mobile sizes. This supersedes the earlier uncertainty about the
  production pricing controls. The existing development server still exhibited
  failed HMR WebSocket handshakes and absent hydration after the matcher change;
  its runtime needs further investigation. It is not reported as fixed.
- `scripts/check-symm-navigation.mjs` verifies recent links, collapse persistence
  after refresh, library search focus, mobile drawer and horizontal overflow.
  It passed against the local production build. It uses browser-only fixtures,
  rejects non-local hosts and blocks API mutations. It does **not** test real
  login, database ownership, or persistence of courses. Desktop and mobile
  screenshots were inspected visually.

To reproduce the fixture check, start a local production build on port 8095
and run `node scripts/check-symm-navigation.mjs`. Set `ALGOGYM_TEST_URL` to
another local port when needed. Screenshots are written to ignored `tmp/`.

## Quality batch: 21 October 2026

- Fixed lesson Markdown rendering: fenced code uses the syntax highlighter and
  copy action; GFM tables, lists, mathematical notation and explicit typography.
- Added independently implemented ThemeCP level schedules (1-97), four distinct
  unsolved exact-rating problems, topic selection, bounded timer, local history,
  accepted timestamp checks and upsolve links. Source attribution is in the UI.
  Local progression never changes official Codeforces ratings or reward balances.
- Refined roadmap into a connected sequence, pricing into compact cards with a
  violet Pro treatment, and the Symm mark into an original crisp vector.
- Produced the actual silent 42-second video, poster, captions and transcript.
  This supersedes the earlier storyboard-only status above.
- Unit suite: 68 passed, 6 opt-in live tests skipped. TypeScript and production
  build passed. Fixture browser checks passed for Symm navigation and training
  selection/persistence/timer/completion. Pricing themes, annual toggle, mobile
  overflow, actual video playback and seeking passed.
- Test fixtures are local-only and do not prove real authentication, live provider
  synchronization or database persistence. Training round notebooks are browser
  local, not cloud synchronized. Refresh solves before finishing a round.
- Stripe is unavailable; paid plans remain previews. Credit migration is still
  unapplied because the intended Supabase project is not connected. No production
  database mutations or paid media operations were performed.

## Final local review

The requested fresh reviewer was dispatched but failed before reviewing because
its account usage limit was reached. The subsequent review was performed by the
implementing agent; this is weaker than independent review.

Two additional regressions were reproduced and fixed: code blocks used block
children inside `code`, and light mode changed lesson text without changing its
dark surface. The markup test failed before the fix; the local browser contrast
check failed with text rgb(71,77,89) on rgb(29,29,37), then passed after shared
workspace theme tokens were applied. Cached lesson navigation and mobile overflow
also passed with fixtures.

A fresh dev process at http://127.0.0.1:8098 connected HMR and hydrated correctly;
the annual pricing toggle worked. The existing 8080 listener still fails the
WebSocket handshake. Its root runtime/proxy issue is not conclusively identified.

Rulings: preserved dirty work on a feature branch instead of moving it; maintained
the skill ledger manually after shell helpers failed; followed the explicit no-paid
media decision; used clearly labeled captures of the real product preview rather
than claiming live generation footage; continued with self-review when the reviewer
service hit its usage cap. Risks: less file isolation, manual audit bookkeeping,
illustrative rather than live footage, and no independent final review.

Remaining launch checks: real authenticated provider/course persistence, Stripe
account onboarding, the target Supabase migration ledger, and Safari video playback.
