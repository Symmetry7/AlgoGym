# Repository audit and cleanup record

Audit date: 2026-10-20. Scope: checked-in source, package scripts and lockfile, Next.js route conventions, API dispatch, Supabase migrations, assets, tests, and deployment configuration. This is a source audit, not proof of the current state of any live Supabase project.

## Classification

| Class | Items and evidence |
| --- | --- |
| Required | `src/app`, `src/proxy.ts`, `server/next-api`, `server/api-handlers`, provider/AI/job services, `supabase/migrations`, `vercel.json`, Next/Tailwind/TypeScript configuration: route, dispatch, runtime, SQL, or build conventions. |
| Shared | `src/components`, `src/hooks`, `src/lib` helpers, `public/` brand/hero/fonts and their license notice, and design-reference PNGs linked from `ui-ux.md`. |
| Generated/local | `.next`, `node_modules`, `*.tsbuildinfo`, `tmp`, `output`, local environment files, coverage: reproducible or local working artifacts, now ignored. Existing untracked files were left in place. |
| Documentation | Root PRD/design/history documents and `docs/SYMM_AI_TRANSFORMATION.md` retain historical context; the new `/docs` files are the current engineering reference. |
| Redundant/unused | Old Vite entry and configuration, one isolated unused API helper, unused standalone screens/components, and their direct dependencies (listed below). |
| Uncertain | Unreferenced design JPG/SVG source files in `assets/`, some dormant shared UI primitives, and diagnostic scripts that may be used manually. Preserved because import absence alone does not prove they are dispensable. |

The checked-in `AGENTS.md` describes a Fusion/Vite starter and conflicts with the running Next.js package scripts. It was already modified in the worktree before this audit and was **not** edited. Maintainers should replace it with accurate Next.js guidance in a separate review.

## Removed files

| File(s) | Evidence and replacement |
| --- | --- |
| `index.html`, `src/main.tsx`, `src/App.tsx`, `src/App.css` | Vite bootstrap path. `package.json` starts Next.js; live pages are under `src/app`. No Next import or route depends on this bootstrap. |
| `vite.config.ts`, `tsconfig.app.json`, `tsconfig.node.json`, `src/vite-env.d.ts` | Configured only the abandoned Vite application. Next uses `next.config.ts` and `tsconfig.json`; Vitest has its own `vitest.config.ts`. |
| `src/lib/supabase.ts` | Unimported `import.meta.env` client for the Vite path. Active auth clients are in `server/supabase.ts`, `src/proxy.ts`, and the session context. |
| `src/lib/user-api.ts` | No imports or route reference; superseded by server provider APIs and typed feature data. |
| `src/screens/ProductPage.tsx`, `src/components/HandleModal.tsx` | No static/dynamic imports, Next route convention, package script, or test reference. Their names were checked in repository-wide search. |
| `src/components/ui/resizable.tsx` | No importer. Its only direct package use was `react-resizable-panels`. |

No migration, externally referenced public asset, font license, or user-created local artifact was removed.

## Moves and structure

| Old | New | Why |
| --- | --- | --- |
| `src/screens/SymmAI.tsx` | `src/features/symm-ai/SymmAI.tsx` | Keep the substantial learning workspace near its related UI. |
| `src/screens/symm-workspace.css` | `src/features/symm-ai/symm-workspace.css` | Keep its stylesheet with the screen. |
| `src/components/symm/SymmAtmosphere.tsx` | `src/features/symm-ai/SymmAtmosphere.tsx` | Only Symm AI imported it. |
| `src/screens/TrainingGym.tsx` | `src/features/training/TrainingGym.tsx` | Feature-local training screen. |

Next route wrappers and imports were updated; route URLs remain unchanged. Other screens and the root `server/` directory were left in place to avoid large import churn. The API dispatch architecture is deliberate and documented, not a candidate for cosmetic relocation.

## Package/configuration cleanup

Removed direct dependencies with no runtime imports: `@react-three/drei`, `@react-three/fiber`, `@swc/core`, `chart.js`, `react-chartjs-2`, and `react-resizable-panels`. Removed Vite bootstrap development dependencies `@vitejs/plugin-react-swc` and direct `vite`; Vitest may still install Vite transitively. Updated the npm lockfile through npm. Renamed the package from the inherited `fusion-starter` label to `algogym`. `.gitignore` now excludes local generated output and permits tracking `.env.example`.

Potentially unused Radix/UI components and assets remain for a later ownership review. No major framework upgrade or speculative server-layer rewrite was performed.

## Validation and limits

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed. |
| `npm test` | 48 passed; 6 opt-in live tests skipped. |
| `npm run build` | Passed; Next.js generated 25 static pages and all dynamic route entries. |
| Local HTTP checks | `/`, `/sign-in`, `/training`, `/training/symm`, its library, `/statistics`, `/societies`, and `/leaderboards` returned 200. Unauthenticated `/api/symm` and `/api/jobs/sync` returned 401; unknown API route returned 404. |
| `node scripts/check-landing.mjs` | Passed at desktop/mobile after fixing the check's lazy-image assertion to examine only in-viewport images. Sign-in dialog and runtime exception checks passed. |
| `node scripts/check-hero-motion.mjs` | Passed, including pause/resume and reduced-motion behavior. |
| `npm ci` | Blocked on Windows: an existing process held `node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node`. Retried outside sandbox with the same file lock. `npm install --ignore-scripts` restored dependencies and exited successfully. |

The local Node 22.11.0 installation is below one transitive package's declared `>=22.12.0` engine requirement, hence the README recommendation. `npm install` reported 26 audit findings (4 low, 5 moderate, 15 high, 2 critical); no automatic major upgrades were made during a behavior-preserving cleanup. The repository has no configured lint script or CI workflow. Live Google sign-in, provider ownership challenges, Gemini generation, migration application, and Supabase RLS cannot be asserted from static source or unauthenticated route checks; they require an isolated configured project and test account. No production user data was modified for this audit.
