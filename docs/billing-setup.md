# AlgoGym test subscriptions

Pro is ₹199 per month with 50 AI credits per successful monthly charge. Premium is ₹399 per month with 150. Every account receives 3 signup credits. A new learning path reserves one credit; a failed generation releases it. Coins remain separate and only come from verified solves.

The database migrations `20261021010000_ai_credit_foundation.sql` and `20261022010000_subscription_billing.sql` are applied to the connected Supabase project. Keep `SYMM_AI_CREDITS_ENABLED=true` only where both migrations exist.

The Razorpay test key ID and secret belong in server environment variables `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`. Never prefix the secret with `NEXT_PUBLIC_`. Create two monthly Razorpay plans at 19900 and 39900 paise, then set their IDs as `RAZORPAY_PLAN_PRO` and `RAZORPAY_PLAN_PREMIUM`. Checkout stays disabled until both plan IDs are set. Each subscription is created for 120 monthly cycles, Razorpay's fixed total count; renewals within that period are automatic.

Configure a Razorpay test webhook at `/api/billing/webhook` and set its separately generated secret as `RAZORPAY_WEBHOOK_SECRET`. Subscribe to `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `subscription.paused`, `subscription.resumed`, and `subscription.halted`. The webhook verifies the raw payload signature, fetches the subscription from Razorpay, and grants credits idempotently using its verified paid count. The account status endpoint also reconciles on visit, so a missed webhook can recover.

The test key ID shown in the dashboard matches `.env.local`. With that key pair, `GET /v1/payments` returns 200, while `GET /v1/plans` and `GET /v1/subscriptions` return 401 `Unauthorized`. The dashboard's Subscriptions section also says “Failed to load subscriptions.” Razorpay's documentation describes test subscriptions before live KYC, so incomplete KYC alone is not a confirmed explanation. The exact account-side cause needs Razorpay support. Do not regenerate working keys or substitute one-time Orders for automatic renewal.

When Plans access works, run `npm run billing:setup`. This checks access, finds or creates the two INR monthly test plans, and saves their IDs to `.env.local`. It stops before creating anything if Razorpay still returns 401. Configure the test webhook and its secret, restart the server, then verify checkout and a simulated renewal before enabling customer use.
