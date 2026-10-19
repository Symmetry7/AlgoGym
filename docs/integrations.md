# External integrations

Ownership, profile metadata, accepted-submission evidence, and rewards are separate capabilities. A linked account does not imply a complete activity sync.

| Provider | Ownership challenge | Public data used | Individual accepted solves | Chakra/coin awards |
| --- | --- | --- | --- | --- |
| Codeforces | Yes | User info, submissions, contest rating history | Yes, via official API sync | Eligible, verified, duplicate-safe |
| LeetCode | Yes | Public profile and aggregate problem data via GraphQL | No reliable individual evidence in current integration | Disabled |
| CodeChef | Yes | Public profile fields | No sync path | Disabled |
| AtCoder | Yes | Public profile fields | No sync path | Disabled |
| GitHub | Yes | Public bio via official REST API | Not a contest submission provider | Disabled |
| GeeksforGeeks | Yes | Public profile bio | No sync path | Disabled |

`server/api-handlers/profile-verification.ts` and `supabase/functions/profile-verification/` implement short-lived ownership challenges. The server stores token hashes and validates a canonical handle and public field. `server/providers.ts` implements Codeforces and LeetCode fetches. `server/sync-worker.ts` normalizes Codeforces submissions/rating events and LeetCode snapshots; `sync_jobs` and the daily cron manage refresh. Codeforces API availability and rate limits may delay jobs. Public LeetCode GraphQL is not evidence of a particular accepted submission.

Problem recommendations can include catalog-backed source links; external educational resources are linked, not copied. See [Chakra](chakra.md) for reward eligibility and [architecture](architecture.md) for the sync flow.
