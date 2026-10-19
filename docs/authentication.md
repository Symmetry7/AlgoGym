# Authentication and authorization

Supabase Auth is the only identity system. The Google handler starts a PKCE OAuth flow and the callback establishes the application session. Email/password sign-up and sign-in, confirmation, recovery, password update, and sign-out are handled by `server/api-handlers/auth/`. `src/proxy.ts` refreshes Supabase cookies on application routes. Redirect destinations are constrained by server-side origin and next-path checks.

Protected API handlers obtain the current user from Supabase rather than trusting a user ID supplied by the browser. Resource handlers then check ownership or membership role. RLS supplies a further database boundary. Server-only service-role access bypasses RLS, so handlers using it must make explicit authorization checks; review both code and SQL policies when adding endpoints.

Google OAuth configuration lives in the Supabase project, not a separate Google-auth server. The application callback is `/api/auth/callback`; set allowed redirect URLs for each local and deployed origin. `APP_ORIGIN` provides the canonical server origin. Public profiles and leaderboards intentionally expose selected public data, while learning paths and tutor conversations are owner-scoped.

For the complete request sequence see [architecture](architecture.md); for endpoint details see [API](api.md).
