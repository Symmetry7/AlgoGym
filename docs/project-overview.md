# Project overview and repository tree

AlgoGym is one Next.js application with a Next.js API layer, server services, and Supabase storage. It is no longer the Vite/React Router starter described by the old root agent note. The Git remote named `origin` points to `https://github.com/Symmetry7/AlgoGym.git`.

```text
AlgoGym/
├── README.md, AGENTS.md, DESIGN.md, PRODUCT.md  # Root entry points
├── docs/                     # Current guides, history, and work briefs
│   ├── README.md             # Documentation index
│   ├── project-overview.md   # This map
│   ├── pricing-interview-brief.md
│   ├── history/              # Older product and design documents
│   └── superpowers/          # Dated implementation specs and plans
├── src/
│   ├── app/                  # Next.js routes and API dispatch
│   ├── screens/              # Product pages
│   ├── features/             # Training Gym and Symm AI
│   ├── components/           # Shared UI and feature components
│   ├── hooks/, lib/, contexts/
│   └── proxy.ts              # Session refresh
├── server/
│   ├── api-handlers/         # Business endpoints
│   ├── next-api/             # Next.js request adapters
│   └── *.ts                  # Billing, AI, provider, and job services
├── supabase/                 # SQL migrations and Edge Function
├── data/                     # Interview import/reference data
├── scripts/                  # Development, import, and QA tools
├── public/                   # Assets served by the app
├── assets/                   # Design references
├── tasks/                    # Active task checklists
└── artifacts/                # Selected visual evidence; generated bundles ignored
```

## Product areas

| Area | Main code | State |
| --- | --- | --- |
| Public site and pricing | `src/screens/Landing.tsx`, `Pricing.tsx`, `src/components/billing/PlanChoice.tsx` | Pricing lists Pro/Premium and Razorpay test checkout when configured. |
| Account and onboarding | `src/components/auth/`, `src/screens/Onboarding.tsx`, `server/api-handlers/auth/` | Supabase sessions, Google and email flows, coding profile connections. |
| Symm AI | `src/features/symm-ai/`, `server/symm-ai.ts`, `server/ai-credits.ts` | Saved paths, lessons, tutor and AI credit allowance. |
| Practice and tracker | `src/features/training/`, `src/screens/Problems.tsx`, `Workspace.tsx`, `server/api-handlers/tracker.ts` | Catalog, sessions, tracked problems and notes. |
| Interview preparation | `src/screens/InterviewPreparations.tsx`, `InterviewLibraries.tsx`, `InterviewTemplates.tsx`, `server/api-handlers/interview.ts` | Extensive catalog and progress; paid access is not implemented. |
| Statistics and rewards | `src/screens/Statistics.tsx`, `server/analytics.ts`, `server/ai-credits.ts` | Provider analytics and separate Chakra/coin and AI credit balances. |
| Societies and contests | `src/screens/Societ*.tsx`, `Contests.tsx`, `server/api-handlers/societ*.ts` | College communities, management, contests and rankings. |

## Repository hygiene

`node_modules`, `.next`, `dist`, `output`, local environments, and TypeScript build info are generated. `artifacts/deploy-*` archives and unpacked snapshots duplicate the source tree and are excluded from Git. Browser QA screenshots are local evidence except for the small set already tracked under `artifacts/interview-qa/`. Local editor/agent installs are ignored; no application code depends on them. Keep `.env.local` private and commit only `.env.example`.
