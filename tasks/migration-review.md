# Additive migration review — 17 October 2026

Target: the existing `sfnmcgcxerbqceujzbqv` project. Read-only audit found 2 auth users, 2 verified coding profiles, and 1 completed legacy onboarding record. Only migration `20261017000000_profile_verification` was installed.

## Preservation and recovery

A timestamped snapshot of all four existing application tables, columns, constraints, policies and the auth-user count is stored in ignored `.local-backups/`. No user identities are deleted, recreated, or remapped. No application rows are truncated or replaced. Existing verification tables remain canonical. Legacy onboarding completion is copied to the new profile record. Rollback is application-level feature disablement; do not drop new ledger/history tables or restore auth identities automatically.

## Reviewed changes

- `20261017010000_algogym_core`: new profile/community/catalog/analytics/ledger structures, ownership-aware RLS and service-only writes.
- `20261017102938_onboarding_sync_rewards`: college/onboarding fields, own-account read policies, normalized search/request workflows, durable sync jobs and leases, immutable versioned reward accounting, and atomic ownership challenge functions.
- Ordinary clients cannot modify activation cutoffs, create awards, run workers, read challenge hashes, approve themselves as staff, or claim external ownership through RPC.
- Initial Codeforces history must finish before reward processing. Only the first eligible accepted problem after account verification, policy activation and user activation may earn Chakra. LeetCode awards remain disabled. Ratings above 3500 are outside policy.
- Apply with vault/config/seed updates disabled. Auth-provider configuration is a separate review; local template defaults must never overwrite live settings.

## Validation evidence

Both migrations were executed against the existing database in an explicit transaction and rolled back. Schema, RLS isolation, direct privilege denial, reward brackets, duplicate processing, historical eligibility, ledger immutability, challenge expiry, regeneration, handle/user binding, single use, duplicate ownership and bounded attempts passed. Synthetic test rows did not persist. Reward tests use fixture evidence only; they do not claim real provider solve verification.

Remaining post-apply checks: schema inventory and original record counts, database advisors, actual provider sync, authenticated browser journeys, OAuth redirect audit and production environment configuration.
