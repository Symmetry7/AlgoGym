# Recording feature map

## Latest reference: heh3.mp4 (17.65 seconds)

Inspected all 18 one-second frames and both complete contact sheets; enlarged key card frames for spacing and hierarchy.

| Timestamp | Observed reference | AlgoGym adaptation |
|---|---|---|
| 00:00–00:02 | Hero, layered product view, partner strip | Existing Blender cube hero retained per explicit request; enlarged to full viewport with mobile stacking. |
| 00:03–00:07 | Large statement and staggered dark feature cards | Focused-practice statement; linked profiles, verified effort, analytics and community cards. No copied financial metrics or invented user counts. |
| 00:08–00:11 | Oversized brand behind product surface | Large AlgoGym typography and overlapping practice panel with actual Training/Problems destinations. |
| 00:12–00:15 | Illustrated feature-navigation rows | Training, Statistics and Communities rows with original decorative diagrams and functional links. |
| 00:16–00:17.65 | Return to opening hero | Existing hero remains the opening; closing Google action preserves the actual authentication flow. |

Validation: TypeScript and production build passed. Eight animation/fallback assertions passed. Twenty-two layout/navigation assertions passed across 320, 390, 768, 1440 and 1920px widths. These checks do not constitute a new end-to-end Google authentication test.

## Current implementation checkpoint — 17 October 2026

The timestamp table below preserves the initial audit. Its pending labels are superseded by this checkpoint:

| Recording feature | Current status and evidence |
|---|---|
| Google/email entry and logout | Implemented. Live email login, confirmation, recovery, password change, cookie persistence, replay rejection and logout passed. Google authorization/redirect checked; interactive Google completion remains pending. |
| Workspace, notes, sheets and sharing | Implemented. Live two-account isolation, real problem metadata, persistent notes/study markers, idempotent sheet items and accepted viewer permissions passed; browser refresh/mobile checks passed. Collaboration revocation and guided tours remain pending. |
| Dashboard and profile menu | Implemented with real study/tracker aggregates and functional destinations. Charcoal dashboard redesign follows the newer screenshot/short clip. Full account-menu logout/account-switch browser journey is not yet accepted. |
| Portfolio, editing, public toggle and card | Implemented. Authorized saves, anonymous privacy enforcement, safe SVG export, real profile fields and light theme passed live API/browser checks. View counts are not implemented. |
| Contest calendar and subscriptions | Implemented. Real provider schedules, month/week/day controls, private idempotent subscriptions and calendar export. Live schedule/subscription/isolation tests passed. No push/email delivery is claimed. |
| Leaderboard metrics and scopes | Implemented via consistent live database ranking with country/college/society filters, podium and own rank. SQL privacy/filter/eligibility checks and anonymous API method checks passed. Full browser filter acceptance remains pending. |
| College selection and community review | Canonical directory imported; keyboard autocomplete and missing-college request implemented. Society application, explicit approvals and role checks implemented and transaction-tested. Initial admin assignment awaits registration of the explicitly named account. |
| Coding statistics and Training Gym | Real CF submission/rating ingestion and LC aggregates synchronized. Analytics/reward unit and database rules passed. CF dossier, track progression and actual reward animation still require full browser acceptance with an eligible real solve. No historical or manually marked question earns Chakra. |
| GitHub analytics, additional provider accounts | External integration work remains. A GitHub social link is not OAuth ownership or contribution analytics. Contest calendar support for another platform does not imply coding-account support. |
| Company kits and purchases | External gate: licensed content and payment setup are absent. Community sheet categories are real; no proprietary frequency, pricing, score or fake checkout is supplied. |

### Updated visual references

- `heh.mp4`, 00:00–00:04.95: compact charcoal dashboard, rounded surfaces, pale/highlight metric panels; 00:01–00:02 includes a blur/reveal transition. Used for surface/layout inspiration, not shipping-dashboard business features or copied data.
- Supplied October 17 screenshot: restrained rounded charcoal panels, lilac bars, green activity and small warm highlights. Applied to shared tokens, dashboard layout and analytics panel surfaces.
- `heh2.mp4`, 00:00–00:08.97: rounded black/violet hero, navigation, left-aligned copy, bottom CTA/scroll control, six iridescent metallic cubes rotating independently and separating/re-forming throughout the clip. Entire timeline inspected at one-second intervals. Implemented with an original Blender-authored GLB plus WebP still and Three.js animation, AlgoGym wordmark/copy and real authentication CTA. Desktop/mobile render, pause/resume, motion advancement, no overflow, reduced-motion still and no runtime exceptions passed eight browser assertions. Original competitor text/branding is not copied.

## Initial audit inventory

Reference: `Screen Recording 2026-10-17 165739.mp4`, 218.30 seconds, 1856×1100. Entire timeline reviewed using 110 timestamped frames at two-second intervals, 13 contact sheets, and full-resolution inspection of significant screens. Source and captures stay in ignored local storage; account emails visible in the recording are not copied into fixtures or documentation. Brief transitions may require further frame inspection during screen comparison.

Status vocabulary: **verified** = stated checks actually ran; **implemented, unverified** = code exists but the complete workflow has not passed acceptance; **pending** = not implemented; **external gate** = missing provider access/data/configuration. A promotional screenshot is not evidence that an underlying API is available.

| Time | Observed feature / interaction | AlgoGym implementation and acceptance |
|---|---|---|
| 00:00–00:16 | Public hero; profile/company-sheet CTAs; company carousel; platform marks | AlgoGym image-based hero and supplied logo implemented; desktop/mobile layout and sign-in dialog verified. Company directory pending; never copy Codolio assets or usage numbers. |
| 00:16–00:24 | Question-workspace promotion: question table, tags, notes, custom sheets | Persistent workspace, question detail, notes, sheet association pending. Marketing previews are distinct from observed editing. |
| 00:24–00:32 | Portfolio promotion: total problems, active days, activity, topic bars, distributions, contests, rating, awards | Verified CF evidence/LC public aggregates implemented; CF dossier views implemented but runtime acceptance pending. Portfolio redesign pending. Awards must derive from actual evidence. |
| 00:32–00:40 | GitHub contribution heatmap, language mix, stars/commits/PR/issues, project cards/add project | Public GitHub adapter, project persistence and ownership OAuth pending; OAuth requires GitHub app configuration. GitHub contributions must never be presented as verified coding solves. |
| 00:40–00:46 | Shareable profile card; contest reminder promotion; FAQ/footer/auth CTA | Privacy-respecting share card, calendar subscriptions, FAQ pending. Actual reminder delivery needs a configured delivery mechanism. |
| 00:46–01:02 | Scroll back through landing; toggle light then dark | Theme control exists in provider but visual shell is dark-only; theme consistency pending. |
| 01:02–01:22 | Sign-in page: email/password, signup/reset links, Google account chooser, success feedback | Server cookie/PKCE and email flows implemented; real interactive Google and recovery acceptance not yet run. Never reproduce Google’s account chooser locally. |
| 01:22–01:30 | Signed-in home: workspace counts, recent/custom sheets, topic analysis; company panel; revision lock at 20 questions | Dashboard must aggregate actual saved workspace rows and verified tracker separately. Daily revision threshold 20 observed; selection behavior inferred and must be documented. |
| 01:30–01:46 | Avatar menu: Profile, Edit Profile, Profile Card, My Sheets, Logout; profile request repeatedly fails | Menu and destinations pending. Implement recoverable profile loading, not reference’s broken screen. |
| 01:46–02:04 | Company kit landing, comparisons, company carousel, 3/6-month/lifetime pricing, hover card flip, FAQ | Company-sheet discovery recorded. Payment service/content access absent: external gate; no fake checkout, invented frequency, or copied score/pricing claims. |
| 02:04–02:24 | Leaderboard loading; C Score/total questions/LC rating/CF rating; top three; current-user rank; global/country filters | Existing snapshot API partial. Add real per-metric ranking, participant count, own rank, country/college filters. Use Chakra instead of proprietary C Score; never blend platform ratings. |
| 02:24–02:32 | College autocomplete and scoped CF leaderboard | Canonical Supabase college directory imported; autocomplete implemented. Leaderboard scoping/own rank pending verification. |
| 02:32–02:36 | Contest calendar: list+month, Today/arrows/month/week/day, search/filter, subscriptions and counts, date change | Server provider adapter, cached contest calendar, own subscription persistence pending. Only show fetched providers. Calendar export is a reliable first reminder boundary; do not claim push/email delivery. |
| 02:36–02:38 | My Notes: Question Notes/General Notes, search/filter, master-detail empty state | Own-user persistence/CRUD and linked question notes pending. Creation/edit behavior inferred, not demonstrated. |
| 02:38–02:42 | My Sheets: followed, custom create, shared-with-you; explore; searchable catalog/categories/follow/progress/show-more/tour | Reuse training_lists/items; add sheet follows/collaborator authorization and real progress. Do not copy proprietary sheet contents, followers, or question counts. |
| 02:42–02:46 | My Workspace: search/filter/sort/favorites/Add; revision 0/20; date calendar; informative empty state | Persistent workspace workflow pending. Manual completion is a personal study marker, never proof for Chakra. |
| 02:46–02:58 | Return to kit/profile (error)/home; avatar menu; logout to sign-in | Existing routes must stay connected; sign-out implemented, full menu/logout journey pending browser acceptance. |
| 02:58–03:18 | Second Google account login; different saved dashboard counts/topic bar; profile skeleton | Session/account data isolation is mandatory. Existing browser storage must not leak progress between users. End-to-end account-switch test pending. |
| 03:18–03:38 | Working portfolio: public toggle, refresh, avatar/name/bio/social/country/college, provider links/verification, solved & active days, heatmap/streaks, contests per platform, rating hover, difficulty/provider donuts, awards, topic expansion, ranking, profile-card link | Persisted privacy/profile editing + typed tracker-backed portfolio pending. CF/LC supported; other providers require real adapters and explicit capabilities. Public visibility enforced server-side. Profile view counts require deduplicated actual visits; omit invented counts and report gate until implemented. |

## Observed versus inferred

- Directly observed: navigation, theme change, OAuth chooser/success, user switch, leaderboard metric/scope changes, college autocomplete, calendar date change, empty notes/sheets/workspace, portfolio rendering/hover and scrolling.
- Visible but not exercised: question/sheet creation, sharing acceptance, note editing, purchases, subscribing, tour, profile-card export, privacy save, provider connection.
- Inferred supporting behavior: validated CRUD, safe collaboration invitations, revision scheduling, loading/error/retry, keyboard controls, and server authorization.
- Refinements: retain AlgoGym branding/purple accent and original verified Chakra economy; avoid copying proprietary C Score, competitor datasets, illustrations, testimonials, user identities or achievements.
