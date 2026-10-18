# AlgoGym

Competitive programming workspace built on Next.js App Router, React, TypeScript, Tailwind/Radix, and the existing Supabase project. The original Vite application has been migrated incrementally; existing user records and verified account associations are retained.

## Run locally

```sh
npm install
npm run dev
```

Open **http://localhost:8080**. An existing server may already be listening there. `npm run dev` reports a port conflict rather than silently opening a different app. The public landing page is `/`; the authenticated workspace begins at `/dashboard`.

Server environment in ignored `.env.local`:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_KEY
CRON_SECRET=YOUR_RANDOM_JOB_SECRET
APP_ORIGIN=http://localhost:8080
```

Existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are supported during migration. Never prefix privileged keys with `NEXT_PUBLIC_` or `VITE_`. Production uses its actual HTTPS `APP_ORIGIN` and requires its own server environment. See [authentication setup](AUTH_SETUP.md).

## Implemented modules

- Google PKCE and email/password authentication with server-managed HttpOnly cookies; confirmation, recovery, logout, and resumable onboarding.
- Canonical Indian college search over an imported Supabase directory, with missing-college requests and authorized review.
- Server-issued Codeforces/LeetCode ownership challenges, separate from provider data synchronization.
- Codeforces submissions, rating histories, difficulty/topic/activity analytics; public LeetCode aggregates where available.
- Durable synchronization jobs and an immutable, versioned, duplicate-safe Chakra ledger. Historical backfills and manual study completion cannot award Chakra; LeetCode rewards remain disabled.
- Problem discovery, source-platform solve links, Training Gym tracks and session restoration.
- Private study workspace, question/general notes, sheets, follows, and accepted viewer/editor sharing.
- Provider contest calendar, private subscriptions, and iCalendar reminder export.
- Privacy-controlled portfolios, profile editing, and own-account SVG share cards.
- Metric-specific public rankings and approval-based college societies, memberships, and administrator review.
- Original Blender-authored animated cube hero with pause and reduced-motion fallback; charcoal dashboard surfaces inspired by supplied references.

Implementation is not equivalent to complete acceptance. See [recording feature map](VIDEO_FEATURE_MAP.md) for verified journeys, unsupported integrations, and remaining work.

## Verification commands

```sh
npm run typecheck
npm test
npm run build
node scripts/check-landing.mjs
node scripts/check-hero-motion.mjs
```

There is no configured lint command. `scripts/test-auth-recovery.mjs` and `scripts/test-study-flow.mjs` require a running local app and server credentials. They create isolated temporary test identities and remove them afterward; the recovery test generates links without sending emails. Database transaction tests in `scripts/sql/` roll back their fixtures. Review live-project scripts before running them.

## Data and deployment

Reviewed additive migrations are in `supabase/migrations/`. Production data must not be reset. Provider synchronization is dispatched by `GET /api/jobs/sync`, authenticated with `CRON_SECRET`; `vercel.json` schedules one daily invocation. Higher-volume deployments need an appropriately provisioned job cadence. Deployment environment and scheduler execution must be verified separately.

Vercel is configured for Next.js in `vercel.json`. API URLs are dispatched through one App Router route at `src/app/api/[...path]/route.ts`; their handlers live under `server/next-api/` and `server/api-handlers/`. This keeps the deployment within the Hobby plan's function limit while retaining the existing URLs and server-side authorization checks.

The profile-verification Edge Function independently validates authenticated users. See [architecture](architecture.md), [database design](api-and-database-design.md), [design system](DESIGN.md), and [implementation plan](IMPLEMENTATION_PLAN.md).

## Hero assets

`public/hero/algogym-cube.glb` and `algogym-cubes-poster.webp` are original local Blender outputs. Rebuild using:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 4.1\blender.exe' --background --factory-startup --python scripts/build-hero-cubes.py
```

The editable `.blend` is saved to ignored `.local-backups/algogym-hero.blend`. Browser animation uses the existing Three.js dependency and loads separately from the page; it does not require a Higgsfield account or external media request.

## October 18: coding connections and self-service societies

- The landing and account panels list Codeforces, LeetCode, CodeChef, AtCoder, GitHub and GeeksforGeeks. The connection dialog uses a searchable provider sidebar and a focused verification pane, stacking on mobile with keyboard focus restoration.
- All six have server-side ownership challenges. Additional public fields: CodeChef Full Name, AtCoder Affiliation, GitHub Bio (official REST API), and GeeksforGeeks public Bio. CodeChef/AtCoder use an exact field match; GitHub/GFG require the complete token separated from other text. Provider responses fail closed when identity or the expected field cannot be established.
- Tokens expire after ten minutes, are stored as hashes, and are rate-limited and bound to the authenticated user/platform/canonical handle. Replacement invalidates old tokens; unique ownership remains enforced atomically. GitHub uses a public-bio challenge, not OAuth.
- Ownership verification and statistics synchronization are separate. Activity sync remains Codeforces/LeetCode only. The four added providers do not yet supply analytics or Chakra awards.
- Society creation is immediate for signed-in users, with only a name required; college and description are optional. No evidence URL, custom slug or administrator approval is required. The creator receives an active organizer membership. The existing internal `approved` visibility state is reused without claiming institutional verification.
- Active members can retrieve a persistent 64-character invite token through an authorized RPC. Public invite pages expose only society identity and description. Joining requires an authenticated POST; repeated joins are idempotent and suspended memberships cannot bypass restrictions. QR images are generated locally on the server with qrcode; no external QR service receives invitations.
- Multiple group memberships are supported while retaining the existing single competitive membership rule. CP duels remain a v2 idea and are not implemented.

### Database deployment and verification

Applied additive migrations `20261017143000_extended_profile_verification.sql` and `20261018001000_self_service_societies.sql` to the existing project. Existing records were preserved. The profile-verification Edge Function was redeployed with internal bearer-token authentication retained.

Commands:
- `npm run dev` — http://localhost:8080
- `npm run typecheck`, `npm test`, `npm run build`
- `node scripts/test-connections-societies.mjs` — real temporary account/API/browser checks; requires configured server credentials, local app, and Chrome/Edge. Fixtures are removed afterward.
- `node scripts/check-extra-public-profiles.mjs` — live public field retrieval.
- `node scripts/check-landing-layout.mjs` — responsive landing checks at five widths.

Evidence: 42 unit tests passed; TypeScript and production build passed. Rollback SQL tests cover new society permissions and ownership challenge expiry/replacement/cross-user/duplicate protections. Live deployed-function checks generated challenges for all four additional providers and rejected incorrect or absent public codes. Actual successful external ownership confirmation still requires a profile owner to place their issued code on that platform; this was not simulated or claimed as an end-to-end success. A production frontend deployment and interactive Google acceptance are separate release gates.
