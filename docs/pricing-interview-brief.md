# Pricing and paid interview preparation: planning brief

This is the starting inventory for the next design and implementation discussion. It records the current code and decisions needed before a detailed spec; it does not enable paid access.

## Current behavior

- `src/screens/Pricing.tsx` and `src/components/billing/PlanChoice.tsx` show Pro at ₹199/month with 50 AI credits and Premium at ₹399/month with 150. Benefits mention Symm AI and Training Gym, but no interview entitlement.
- `server/billing.ts` defines the same plan prices. `server/api-handlers/billing.ts` returns `free`, `pro`, or `premium` only for a verified active paid subscription with a future end date. `docs/billing-setup.md` records the Razorpay test configuration gate.
- Interview pages live at `src/app/interview-preparations/[[...path]]/page.tsx` and render `src/screens/InterviewPreparations.tsx`. Notes, resume, and email libraries are in `InterviewLibraries.tsx` and `InterviewTemplates.tsx`.
- `server/api-handlers/interview.ts` serves catalog, answers, progress, and administrative modes. The catalog and many resources are currently readable without a paid subscription. Some content is embedded in client components. Hiding navigation alone would leave that content accessible.

## Decisions to make with product input

1. Define exactly what is free: a public directory/preview, a limited sample, or no interview content. Specify whether saved progress stays visible when a subscription expires.
2. Choose which paid tier includes interview preparation: Pro, Premium, or both. Decide whether it is included in the current price or requires a new plan/price. Keep existing subscribers' promised access clear.
3. List the requested pricing UI changes and the exact extra data to add or edit: copy, benefits, prices, catalog records, or something else.
4. Decide launch conditions for billing. Razorpay is documented as test-only and the setup note records a subscription API access blocker. Production access must wait for a verified payment flow.

## Implementation order after those decisions

1. Write an access matrix for anonymous, free, Pro, Premium, expired, and admin users, covering each interview route and API mode.
2. Put entitlement evaluation in one server service based on verified subscription status. Enforce it in interview API reads, answer generation, progress writes, and any server-rendered content paths. Keep administrative access separate.
3. Move any paid content currently embedded in client bundles behind protected server responses. Public pages should receive only preview data.
4. Update pricing cards, comparison copy, navigation, and locked/upgrade states using the same entitlement definition.
5. Test direct URLs, API calls, sign-out, expired/cancelled subscriptions, webhook renewal, and existing saved progress. Verify no paid content leaks in the page HTML or JavaScript bundle.

Relevant files: `src/screens/Pricing.tsx`, `src/components/billing/PlanChoice.tsx`, `src/hooks/use-billing.ts`, `server/billing.ts`, `server/api-handlers/billing.ts`, `server/api-handlers/interview.ts`, and `supabase/migrations/`.
