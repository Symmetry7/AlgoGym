# AlgoGym repository instructions

AlgoGym is a Next.js 16 App Router application using React 19, TypeScript, Tailwind CSS 3, Vitest, Supabase, and Vercel. The old Vite/React Router starter description is obsolete.

## Where code lives

- `src/app/` defines pages, layouts, and the `/api/*` dispatch route.
- `src/screens/` holds product screens; `src/features/` holds Training Gym and Symm AI.
- `src/components/`, `src/hooks/`, `src/lib/`, and `src/contexts/` hold shared client code.
- `server/api-handlers/` contains business endpoints; `server/next-api/` adapts them to Next.js requests.
- `supabase/migrations/` is the ordered database schema history. `supabase/functions/` has Edge Functions.
- `docs/README.md` indexes current guides. `docs/history/` holds older product and design references.

## Development

Run `npm run dev` for the local server on port 8080, `npm run typecheck` for TypeScript, `npm test` for Vitest, and `npm run build` for a production build. New unit tests use `.spec.ts` or `.spec.tsx` beside the code under test. Browser and database QA scripts in `scripts/` have separate credentials and setup requirements.

## Product and data boundaries

- Server code is authoritative for authentication, paid access, AI credits, and Chakra/coin rewards. Do not rely on hidden UI controls to protect content or grant balances.
- Keep AI credits separate from Chakra/coins. Only verified eligible provider solves can award Chakra.
- Preserve existing user data and apply additive, reviewed Supabase migrations. Do not infer live database state from migration files alone.
- Interview preparation is currently readable without a paid entitlement. See `docs/pricing-interview-brief.md` before changing its access rules.
- Root `README.md`, `DESIGN.md`, and `PRODUCT.md` are project/tool entry points. Documentation belongs under `docs/`; active task checklists belong under `tasks/`.
