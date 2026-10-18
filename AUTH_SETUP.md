# Authentication and ownership verification

## Runtime

Next.js route handlers adapt the shared server API modules. `@supabase/ssr` performs PKCE code exchange and stores server-managed HttpOnly cookies. `src/proxy.ts` refreshes sessions. Protected pages validate the user and load onboarding completion from the database; the public landing page does not force a modal.

Use server-side `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, and the actual `APP_ORIGIN`. Privileged keys are never client configuration. Existing Vite-named public connection variables remain compatibility fallbacks only.

## Google configuration

Google Cloud's OAuth client must authorize the **Supabase** callback:

`https://YOUR_PROJECT.supabase.co/auth/v1/callback`

Supabase Google provider configuration holds the client ID and secret. The application callback is `/api/auth/callback`, which exchanges the one-time PKCE code. Supabase's redirect allowlist must admit that callback for local and production origins.

For the existing configured project, the reviewed remote change on 17 October 2026 set:

- Site URL: `https://algogym.vercel.app`
- Additional redirects: `http://localhost:8080/**`, `http://127.0.0.1:8080/**`, `https://algogym.vercel.app/api/auth/callback`

Only those two auth URL settings changed; provider credentials, confirmation policy, and MFA settings were preserved. Never push the root local Supabase template wholesale to production.

The authorization endpoint and actual redirect to Google's account chooser were checked. An interactive Google login in the user's browser, including its final restored session, still requires acceptance; do not infer success from an HTTP redirect alone.

## Email and recovery

`POST /api/auth/email` handles signup, login, recovery request, and authenticated password updates with origin validation. The callback accepts supported `token_hash` types (`email`, `signup`, `recovery`, `email_change`) as well as PKCE codes. Recovery defaults to `/account/reset-password`; other sign-ins proceed through the dashboard's onboarding guard.

If customizing Supabase email templates, use the project's actual application callback and the supported token-hash type. Retain secure email-change confirmation settings. Real confirmation and recovery challenge consumption, token replay rejection, cookie persistence, password replacement, invalid challenge rejection, cross-origin protection, and logout passed the local live-service test. Inbox delivery and SMTP configuration were not tested by generated-link tests.

## Coding ownership challenges

Apply reviewed migrations in order; preserve current records. Deploy the function with:

```sh
supabase functions deploy profile-verification --project-ref YOUR_PROJECT_REF --use-api --no-verify-jwt
```

Gateway JWT verification is disabled for this deployment's compatibility, **but the function itself validates the bearer identity with Supabase Auth before every operation**. It never treats an arbitrary JWT payload as authentication. The function's built-in server credentials are not returned to clients.

Challenges are cryptographically random, platform-specific, user/handle-bound, hashed in storage, rate-limited, single-use, and expire after ten minutes. Regeneration invalidates the old challenge. Atomic database functions prevent concurrent duplicate ownership claims.

- Codeforces: fresh official `user.info`, exact `firstName` match.
- LeetCode: fresh anonymous public GraphQL `matchedUser.profile.aboutMe`; token boundary matching permits appending to existing Summary content. If the field is unavailable or a provider fails, verification remains pending.

Ownership verification and synchronization are separate. Public LeetCode aggregate counts do not prove individual accepted submissions and do not award Chakra. Tests of database challenge rules and provider failure handling do not replace acceptance using a user's deliberately edited real public profile.

## Initial platform administrator

An administrator must be an explicitly authorized existing confirmed account. The account named by the product owner has not registered in the configured project as of the last check, so no bootstrap role was assigned. `scripts/assign-initial-admin.mjs` checks that identity and records authorized assignment in the audit log; it does not create users or alter other accounts. Ordinary accounts were verified unable to access the review queue.
