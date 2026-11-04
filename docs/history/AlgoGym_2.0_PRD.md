# AlgoGym 2.0 — Product Requirements Document

**Version:** 1.0 (draft for implementation planning)  
**Date:** 17 October 2026  
**Product:** AlgoGym  
**Existing project:** https://github.com/Symmetry7/AlgoGym  
**Live site:** https://algogym.vercel.app  
**Status:** Proposed requirements; requires repository audit and stakeholder approval

## 1. Executive summary

AlgoGym 2.0 evolves the existing competitive-programming training product into a community-based platform for college competitive-programming (CP) societies. Students connect verified coding profiles, practice curated Codeforces and eligible LeetCode problems, earn **Chakra** points for newly verified solves, monitor detailed progress, and represent a registered college society. Societies get a roster and performance dashboard; individuals, societies, and colleges compete on distinct, transparently defined leaderboards.

The experience will receive a comprehensive design-system and UX redesign while preserving working functionality and user data. AlgoGym should be differentiated by **structured practice + society management + trustworthy inter-college rankings**, not merely by aggregating coding statistics.

### Product goals
1. Enable legitimate college CP societies to register, manage members, and measure progress.
2. Offer transparent individual, society, and college leaderboards.
3. Incentivize challenging practice with Codeforces-rating-based and verified LeetCode difficulty-based Chakra rewards.
4. Deliver trustworthy Codeforces/LeetCode profile linking and data freshness indicators.
5. Make statistics useful for students and society administrators.
6. Modernize the product's visual quality, responsiveness, accessibility, and navigation.

### Non-goals for initial release
- Online code execution/judging owned by AlgoGym.
- Direct messaging, public social feeds, video courses, AI tutoring, merchandise, payments, subscriptions, or complex gamification currencies.
- Cross-platform unified *rating* derived from incompatible Codeforces and LeetCode rating systems.
- Native mobile applications.
- Automatic verification that somebody is enrolled at a college purely from a coding-profile username.

## 2. Existing product and implementation context

Existing references: [GitHub](https://github.com/Symmetry7/AlgoGym), [production deployment](https://algogym.vercel.app). Previous assessment indicated a React + TypeScript + Vite frontend, Tailwind/Radix components, TanStack Query, charts, animations, and a Supabase SDK dependency. **Audit actual source code, production authentication, schema, integrations, cron/sync jobs, and deployment configuration before committing to an implementation approach.** A dependency alone does not prove production architecture. The exact current behaviors of training/statistics need code-level confirmation.

**Preserve and extend** existing React/TypeScript infrastructure unless the audit identifies an unavoidable constraint. Do not rewrite into Next.js simply for the sake of rewriting.

## 3. Audiences and user roles

| Role | Core capabilities |
|---|---|
| Visitor | Browse public profiles and leaderboards; view approved public societies. |
| Student/programmer | Google sign-in; verify accounts; train; earn Chakra; view analytics; request society membership. |
| Society moderator | Review join requests and manage member roster, within delegated permissions. |
| Society admin | Update society details, approve/reject joins, assign moderators, review society insights and membership disputes. |
| Platform admin | Review society applications, verify society identity, moderate memberships, handle appeals, configure challenge/scoring policies, examine sync failures and audit logs. |

**V1 membership policy:** Each student has at most **one active competitive society membership** at a time. A college can host multiple independent societies. Historical society membership is preserved for audit and time-bounded leaderboards. Society membership does not automatically prove enrollment; society administrators approve claims.

## 4. Core user journeys

### 4.1 First-time student
1. Opens AlgoGym; public pages remain visible, but protected actions trigger a minimal sign-in modal.
2. Signs in using Google OAuth.
3. Enters account-linking onboarding: Codeforces handle first; LeetCode optional unless entering its corresponding leaderboard.
4. Proves handle ownership via a short-lived server-issued token in a publicly readable, editable profile field (only after verifying current platform field/API reliability).
5. Selects college; requests membership in an existing approved society or continues without society.
6. Reaches personalized dashboard with training recommendations and clear incomplete-onboarding actions.

### 4.2 Society registration
1. Authenticated student searches for their college and submits a new society application.
2. Supplies society name, unique slug, description, official link, and evidence of authority.
3. Application is pending; duplicate college/society names are flagged for human review.
4. Platform admin approves/rejects with a reason.
5. Approved society admin can review membership applications, configure public profile, and view analytics.

### 4.3 Training and Chakra
1. User chooses a difficulty range or topic in AlgoGym training.
2. User opens a Codeforces problem and submits **on Codeforces**.
3. AlgoGym synchronizes the verified user's Codeforces submissions.
4. The first eligible accepted solution for that user/problem is credited once; Chakra ledger updates.
5. Updated total, breakdown, and leaderboard position appear with sync timestamp.

### 4.4 Society member journey
User searches society, requests to join, admin approves, and stats begin contributing according to published aggregation rules. Historical events retain their original timestamps so changes cannot inflate retrospective standings.

## 5. Functional requirements

### FR-01 — Authentication, identity, and linked platforms (P0)
- Sign in with Google OAuth; secure server-validated sessions, CSRF/state protection, appropriate redirect handling, logout, and session restoration.
- Unauthenticated protected actions show a clean sign-in modal; no repeated modal for signed-in users.
- Unique coding-platform handles linked to one AlgoGym user at a time; verified re-link and dispute process.
- Codeforces username existence check through official `user.info`; ownership via fresh server-side retrieval of a temporary challenge token placed in a public editable field (candidate: first name, subject to current UI/API verification).
- For LeetCode, confirm the profile Summary field can be edited and *reliably read* by a supported server-side endpoint before committing to the same workflow. If not reliable, do not falsely attest ownership; defer ranked linking until a defensible method is available.
- Tokens: cryptographically random, platform-specific, single active challenge, 10-minute expiry, hashed at rest, bounded retries/rate limits; log verification outcome but not sensitive token values.
- Verification is tied to user ID + platform + target handle; no frontend-only verification success.
- Show Connected / Pending / Verified / Error and last successful refresh states.
- Codeforces verification required for ranked Chakra and Codeforces metrics; LeetCode only for LeetCode views. Onboarding can be resumed.

### FR-02 — Colleges and societies (P0)
- Searchable normalized college entities; admin workflow to merge duplicates and correct names.
- College > society > membership hierarchy; multiple societies per college.
- Society application fields: college, unique society name/slug, description, public link, requested admin, authority evidence, optional logo/cover.
- Society statuses: pending, approved, rejected, suspended; reasons and audit trail retained.
- Society admin can edit presentation, invite/review/remove members and appoint moderators; no access to other societies' private data.
- Membership states: requested, invited, active, rejected, left, removed; start/end timestamps.
- Prevent concurrent active memberships across competitive societies in V1; explicit transfer process with effective date and cooldown (suggested 30 days, configurable and subject to policy approval).
- Public profile: branding, college association, approved verification badge, member count, competitive stats, leaderboard, and recent trend.
- Platform admin can approve applications, resolve duplicate claims and investigate abuse.

### FR-03 — Profiles and coding metrics (P0)
- Profile includes display name, college/society, verified handles, avatar, Codeforces current/max rating where available, count of unique solved Codeforces problems, Chakra, and contribution/activity overview.
- Keep platform-specific metrics distinct: Codeforces rating is never averaged with LeetCode contest rating; Codeforces solve count and LeetCode solve count are separately sourced.
- Each metric has a source, updated-at timestamp, and stale/unavailable status.
- Respect users' display/privacy preferences and platform API terms; only store necessary public data.

### FR-04 — Training + Chakra rewards (P0)
- Preserve current training workflows and expand the eligible catalog to Codeforces and, **only where accepted submissions can be reliably verified**, LeetCode.
- Credit Chakra only for independently confirmed accepted solutions by the verified owner of a linked platform account. A checkmark, self-report, page visit, or public aggregate solved count alone must never authorize a reward.
- Eligibility: verified handle; eligible catalog problem; accepted solve **after Chakra activation**; uniquely identified problem; no prior Chakra reward to the same user for that provider/problem.
- Never award twice for retries, resubmissions, alternate URLs, sync replay, or the same problem encountered in multiple AlgoGym training lists.
- The following are **proposed product-design values**, not provider-native difficulty scores; store as a configurable versioned policy.

#### Codeforces Chakra reward schedule (through rating 3500)

| Codeforces problem rating | Chakra earned per first verified solve |
|---|---:|
| 800–999 | 10 |
| 1000–1199 | 15 |
| 1200–1399 | 25 |
| 1400–1599 | 40 |
| 1600–1799 | 60 |
| 1800–1999 | 85 |
| 2000–2199 | 115 |
| 2200–2399 | 150 |
| 2400–2599 | 190 |
| 2600–2799 | 240 |
| 2800–2999 | 300 |
| 3000–3199 | 375 |
| 3200–3399 | 475 |
| 3400–3500 | 600 |
| Above 3500 | 600 (provisional cap; requires policy review) |
| Unrated / missing rating / below 800 | 0 until explicit policy exists |

Use inclusive range boundaries, with all ratings in the same band earning the same Chakra. If Codeforces changes a problem's rating later, keep the rating and reward snapshot captured at award time.

#### LeetCode Chakra reward schedule

| LeetCode difficulty | Chakra earned per first verified solve |
|---|---:|
| Easy | 15 |
| Medium | 45 |
| Hard | 110 |
| Unknown / not classified | 0 until classified |

**LeetCode verification gate:** Linking a LeetCode profile or seeing its aggregate `acSubmissionNum` count does **not** establish which problem was newly solved or its submission time. LeetCode Chakra goes live only after a reliable, compliant server-side mechanism can confirm **per-problem accepted solutions** attributable to a verified profile after Chakra activation. If this cannot be built reliably, show LeetCode difficulty rewards as **planned** and keep LeetCode Chakra awarding disabled; retain LeetCode stats independently where permitted. Do not infer new solves from changes in aggregate profile counters. Do not require users to provide session cookies or passwords.

#### Unified Chakra ledger and examples
- The user's **total Chakra** combines confirmed awards from both platforms: `total = SUM(chakra_ledger.delta)` over valid credits and reversal entries.
- Deduplicate by `(AlgoGym user ID, platform, canonical provider problem ID)`; distinct problems on different platforms can each earn an award. A problem appearing in multiple lists on the **same** platform earns once only.
- Sample rewards: first verified Codeforces 1500-rated solve → **40 Chakra**; first verified Codeforces 2900-rated solve → **300 Chakra**; first verified Codeforces 3500-rated solve → **600 Chakra**; first verified LeetCode Medium solve → **45 Chakra**. These four different problems yield **985 Chakra** total.
- Each immutable ledger credit captures user ID, platform, canonical problem ID, qualifying accepted submission/proof reference, difficulty/rating snapshot, policy version, credited time, and Chakra amount. Correct mistakes with a linked reversal entry, never silently overwrite historical credits.
- Admins can version policies for future awards; no automatic retroactive rescoring. For missed syncs, backfill only within an explicitly bounded eligible window with provenance.
- Chakra is non-monetary and cannot be transferred or redeemed for cash. Streak bonuses and repeated-solve rewards are excluded from V1.
- Show per-platform Chakra subtotals, pending verification, and last-sync timestamps on profiles and leaderboards.

### FR-05 — Individual, society, and college leaderboards (P0)
**All leaderboard filters must define the ranking metric explicitly. No opaque blended “best coder” score in V1.**

**Individual boards:**
- Chakra (all-time / rolling 30 days / semester, where data permits).
- Unique verified Codeforces problems solved (all-time, subject to complete historical data).
- Codeforces current rating (and separately max rating, optional).
- LeetCode solved count and contest rating only when verified and reliably supported.
- Scope: platform-wide, college, society. Filters for approved membership and metric freshness.

**Society boards:**
- Chakra: normalized **average of top N eligible active members**, recommended N=10 with a minimum 5 qualifying members; display actual N and eligibility count. Also show raw Chakra separately, but never use raw sum as the default inter-society rank because size dominates.
- Codeforces rating: average of top 10 rated active verified members, with at least 5 required; unrated users excluded and counts displayed.
- Unique-solved metric: average verified distinct solves per eligible member (rather than raw total).
- Tie breaker for Chakra: more distinct eligible members, then more unique eligible problems, then stable society ID. Publish tie-break rules.

**College boards:**
- Use deduplicated unique students across approved societies; apply the same normalized metrics. Do not double-count members across society transfers.
- Each score is computed from time-consistent membership snapshots and metric-specific eligibility rules.

**Fairness + anti-abuse:**
- Show eligibility minimums, population size, period and update time on every board.
- Prevent newly joined students' entire historical Chakra from being retroactively credited to a society's *period* board; attribute eligible Chakra earned during active membership in the period.
- Personal lifetime Chakra remains with student on society transfers.
- Consider a society age requirement (e.g., 7 days post-approval) for featured boards, subject to testing.
- Quarantine suspicious profile linkage, mass transfers and unusual data jumps pending manual review.
- Cache leaderboard snapshots; provide stale indicators rather than fabricated live refreshes.

### FR-06 — Enhanced statistics (P0)
**Individual analytics:**
- KPI row: verified unique solves, current Codeforces rating, peak rating, Chakra total, Chakra last 30 days, active practice days.
- Codeforces rating trend and contest history (when source data available).
- Solved problems by difficulty band and by tags/topics, with filters.
- Weekly/monthly submission activity heatmap and daily solved trend.
- Chakra earned over time with links to underlying verified solves.
- Progress vs previous 7/30 days; time-range and platform filters.
- Empty, loading, stale, source-error, and inaccessible-data states.

**Society analytics:**
- Members, active members (define active as >=1 qualifying solve in selected 30-day period), median rating, average rating among rated members, total and per-member period Chakra, participation trends, rating distribution, top contributors and topic strengths.
- Admin-specific member table with search/filter and export of permitted fields (CSV can be P1).
- Compare this society with college median and eligible peer societies without exposing private member information.

**Statistical precision:**
- Don't mistake accepted submissions for distinct solved problems.
- Show denominator and sample size on averages; median avoids outlier dominance.
- All derived data must be reproducible from event and snapshot tables.
- Do not imply real-time freshness without the actual refresh schedule.

### FR-07 — UI/UX redesign (P0)
- Define reusable dark-first design tokens (color, typography, spacing, elevations, motion, graph palette); accessible light mode may follow if resources permit.
- Desktop navigation: Dashboard, Train, Leaderboards, Societies, Statistics, Profile. Mobile: simplified responsive navigation.
- Consistent table behavior, metric cards, filters, clear empty states and understandable verification status.
- Dashboard prioritizes actions: Continue Training, Today's Progress, Chakra, Rating Trend, Society Rank. Avoid unrelated badges/animation clutter.
- Visual language: serious, technical, high-quality developer SaaS rather than gimmicky gaming UI. “Chakra” can use a restrained energy motif without copyrighted Naruto characters or assets.
- WCAG 2.2 AA target for color contrast, keyboard support, focus management and motion reduction.
- Provide responsive designs at small mobile, tablet and desktop breakpoints; charts remain readable and accessible.
- Avoid unnecessary popups: gate only protected actions and display onboarding progressively.

### FR-08 — Sync, observability and administration (P0)
- Periodic and user-triggered (rate limited) Codeforces sync jobs for user.info, relevant submission history, problemset ratings, contest rating history; prefer official API capabilities and respect limits.
- LeetCode integration must undergo feasibility validation for supported fields and request limits; no unofficial brittle dependency should be a hidden core requirement.
- Incremental sync with cursor/watermark where feasible, idempotent upserts, retries/backoff, dead-letter/recovery path and last-success timestamps.
- Admin overview for pending societies, handle ownership disputes, Chakra reversals, duplicate joins, sync failures and stale data.
- Audit significant moderation, verification, reward, and score-policy changes.

## 6. Proposed information architecture

- `/` — landing and positioning
- `/login` or accessible modal — Google sign-in
- `/onboarding` — coding handles and society selection
- `/dashboard` — personal overview
- `/train` — training catalog, difficulty/topic filters and status
- `/train/:id` — eligible task/problem detail
- `/leaderboards` — individual/society/college tabs and metric filters
- `/societies` — society directory
- `/societies/:slug` — society public profile, members and rankings
- `/societies/:slug/manage` — permission-gated society management
- `/statistics` — personal analytics
- `/u/:username` — public programmer profile
- `/settings` — profile, linked accounts, privacy
- `/admin` — platform administration

Use the project's existing route conventions when updating; these are logical route targets, not a mandatory migration.

## 7. Data model (proposed entities)

| Entity | Key data |
|---|---|
| `users` | ID, auth subject, public display name, avatar, privacy preferences, created time |
| `external_accounts` | User, platform, canonical handle, verified timestamp, unique platform+handle |
| `verification_challenges` | User, platform, target handle, token hash, expiry, attempt count, status |
| `colleges` | ID, normalized name, location, aliases, verification status |
| `societies` | College ID, name, slug, description, links, application status, approved timestamp |
| `memberships` | User, society, role, status, start/end timestamps, inviter/approver |
| `problems` | Codeforces contest ID, index, title, rating, tags, eligible flag, last synced |
| `submissions` | External account, submission ID, canonical problem, verdict, time; unique platform+submission |
| `chakra_policies` | Version, effective timestamp, Codeforces rating bands and LeetCode difficulty reward mapping |
| `chakra_ledger` | User, platform, canonical problem ID, submission/proof, rating or difficulty snapshot, policy version, delta, reason, event time |
| `user_metric_snapshots` | User, source, rating, max rating, unique solves, updated timestamp |
| `leaderboard_snapshots` | Metric, scope, window, eligibility, rank, score, computed timestamp |
| `society_applications` | Applicant, evidence, decision, reviewer and rationale |
| `audit_events` | Actor, operation, subject, timestamp, safe metadata |

Apply row-level authorization (including database RLS if Supabase is retained). Keep unique indexes and idempotent ingestion boundaries. Restrict private membership evidence to authorized reviewers and implement retention/deletion policy.

## 8. High-level system architecture

```text
React + TypeScript + Vite UI
          |
          v
Authentication / API boundary (server-trusted)
          |
    +-----+------------------+
    |                        |
Community & Profile API    Training / Chakra Service
    |                        |
    +-------------+----------+
                  |
          Relational Database
                  ^
                  |
        Sync jobs / scheduler
          |               |
   Codeforces API    LeetCode (only verified supported access)
                  |
      Metric + leaderboard aggregation workers
```

Principles: protect provider access on server, use persistent background jobs for syncs, compute Chakra from verified events, derive rankings from documented rules, store freshness timestamps, cache expensive analytics, and avoid exposing privileged service keys client-side. Design database indexes for problem IDs, user activity, membership period, and leaderboard windows.

## 9. Non-functional requirements

- **Availability:** Graceful partial outage when Codeforces/LeetCode unavailable; cached views display last-sync time.
- **Performance targets:** P75 LCP <2.5 s on representative mobile landing/dashboard, main navigation interactive promptly; common cached leaderboard and profile queries targeted at <500 ms server response, measured in staging.
- **Accessibility:** WCAG 2.2 AA target and screen-reader alternatives for charts.
- **Security:** Least-privilege access, OAuth correctness, server-side trust boundaries, anti-CSRF, secure session cookies, input sanitization, rate limiting, audit logs.
- **Privacy:** User controls for public profile; data minimization; support profile/account deletion and society membership exit; no sensitive proofs in public API.
- **Reliability:** Idempotent event ingestion, de-duplication, replayable Chakra ledger, retry queue and monitoring of provider limits.
- **Scale assumptions:** Start with pilot societies and hundreds to several thousand students; measure before adopting more complex infrastructure.
- **Observability:** Sync lag, external API error rate, verification failures, award discrepancies, leaderboard job duration, client errors and web vitals.
- **Testing:** Unit, integration, API contract, authorization, reconciliation, and end-to-end flows.

## 10. Product metrics

| Metric | Definition |
|---|---|
| Activated students | Signed in + verified Codeforces + completed first eligible training solve |
| Active communities | Approved society with >=5 active verified members in last 30 days |
| Weekly active trainees | Distinct users earning >=1 verified eligible solve in a week |
| Society participation | Eligible active members / eligible active society members |
| Practice progression | Change in proportion of verified solves in higher difficulty bands over time |
| Verification completion | Successful Codeforces links / initiated challenges |
| Data health | % eligible verified users synced successfully within stated freshness SLA |
| Retention | Week 1 and week 4 return/solving cohorts |

Avoid using Chakra total alone as the north-star KPI; doing so incentivizes easy-solve farming and size bias.

## 11. Rollout and prioritization

### Phase 0 — Audit and validation (required)
- Inspect current routes, data model, Codeforces fetching, training logic, auth, statistics and deployment environment.
- Prototype public-field verification for both platforms. Confirm LeetCode feasibility separately.
- Establish baseline telemetry, choose migration strategy and preserve existing user data.
- Lock point table and society fairness policy with representative society organizers.

### Phase 1 — Foundations (P0)
- Google authentication, user profiles, secure Codeforces linking, normalized college directory, society registration and memberships.
- Initial reusable UI design system and redesigned core shell/navigation.

### Phase 2 — Chakra + leaderboards (P0)
- Codeforces catalog and submission ingest; Chakra ledger, reconciliation and clear pending states.
- Individual, society and college boards with documented metrics, eligibility thresholds and periods.
- Anti-duplication, audit controls, aggregation snapshots.

### Phase 3 — Statistics + experience (P0)
- Overhauled personal analytics, society insights, visualization quality, mobile and accessibility work.
- Improve loading/empty/error states, performance and data quality.

### Phase 4 — Pilot and stabilization (P0)
- Invite 3–5 college societies; verify administrative ownership, backfill sample histories, reconcile scoreboards, test society transfers and appeals.
- Publish policies and collect feedback before public expansion.

### Later (P1/P2 only after demand evidence)
- Team competitions and society-hosted challenge sets; opt-in notifications, exports and advanced analytics.
- Season-based trophies, curated learning paths and enhanced recommendations.
- Native mobile app, if sustained engagement validates it.

## 12. Acceptance criteria

1. Guest can browse public approved pages but protected actions require Google sign-in.
2. Returning user preserves session and completed onboarding status.
3. Account linkage cannot be marked verified without a fresh server-side ownership challenge.
4. A linked Codeforces identity cannot be claimed simultaneously by unrelated users.
5. College can contain multiple societies; society applications are approved through permission-gated workflow.
6. An active student contributes to at most one competitive society in V1.
7. First eligible accepted Codeforces or verifiably supported LeetCode solve awards the published Chakra amount; duplicate submission/re-solve awards zero additional Chakra.
8. Unrated problems and unsupported/unverifiable provider submissions cannot silently earn ranked Chakra.
9. Chakra totals reconcile to immutable credit/reversal ledger entries.
10. Individual leaderboards support distinct metric selectors and period filters; society/college rankings disclose eligibility, sample sizes and normalization.
11. Joining/leaving a society cannot retroactively transfer historical period Chakra into the new society.
12. Analytics accurately distinguish accepted submissions from distinct solved problems and display metric source and freshness.
13. Provider outages degrade gracefully without inventing verified scores or fake near-real-time data.
14. Society admins cannot read or mutate another society's restricted records; platform admins have an auditable moderation path.
15. Mobile layouts, keyboard navigation, reduced-motion support, loading/empty/error states and chart accessibility pass QA.
16. Existing users, recorded solves and training functionality are migrated without silent data loss; reconciliation tests pass.

## 13. Risks and mitigations

| Risk | Mitigation |
|---|---|
| LeetCode public profile access changes | Validate endpoint and field first; keep integration optional and source-specific. |
| Codeforces API limits or temporary downtime | Queue/rate-limit fetches, retry with backoff, expose last sync. |
| Farming Chakra through repetition or old solves | Unique canonical problem constraints, first accepted submission only, clear eligibility start, immutable ledger. |
| Society size distorts rankings | Top-N/eligible-member normalized scores, minimum counts, raw metric separately shown. |
| Fake societies or mass-member transfers | Manual approval, evidence, audit trail, transfer effective dates and cooldown. |
| Confusion between Codeforces and LeetCode metrics | Separate filters, units and provenance; never blend incompatible ratings. |
| Overambitious redesign disrupts current product | Inventory current features, migrate incrementally, use regression tests and staging. |

## 14. Decisions to finalize before implementation

These are genuine product-policy choices, not blockers to drafting this PRD:

1. **Society eligibility:** Confirm minimum 5 active qualified members and top-10 normalization; pilot may justify changes.
2. **Competitive membership:** Confirm one active society and proposed 30-day transfer cooldown.
3. **Chakra eligibility start:** Recommend awarding only accepted solves after user links/activates Chakra; do not reward full historical solves automatically.
4. **Eligible training catalog:** Confirm whether all rated Codeforces problems solved through any route count or only problems deliberately added to AlgoGym training. Recommended V1: all catalogued rated problems after Chakra activation, regardless of click path, if provider submissions prove acceptance.
5. **Leaderboard windows:** All-time and 30-day initially; semester only if colleges want academic-season comparison.
6. **LeetCode:** Make verification and ranked integration dependent on a reliable and compliant data-access path.
7. **College directory:** Determine geographical initial coverage and who manages merges/aliases.
8. **Privacy and retention:** Define college-email proof handling and account deletion policy before collecting documents.

## 15. Definition of Done

Release is ready when core flows pass E2E tests, scoring is deterministic and reproducible, member access is isolated, society approval works, all leaderboards explain their rules, migration is reconciled, production monitoring is operational, and pilot community administrators can manage their society without platform-engineer intervention.

---

*This PRD deliberately excludes unrelated features and unverified assumptions. It should be refined after a full source audit, API feasibility checks, and pilot-society feedback.*
