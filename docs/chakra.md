# Chakra rewards and coins

The database economy is named **Chakra** (`chakra_*` tables); parts of the current interface present the balance as coins. Both labels refer to the same underlying ledger, not two currencies. Learning-path creation, opening a problem, and marking a lesson complete do not independently mint rewards.

## Codeforces rating policy

The SQL policy and award functions in `supabase/migrations/` are authoritative. The configured brackets are:

| Rating | Points | Rating | Points |
| --- | ---: | --- | ---: |
| 800–999 | 10 | 2200–2399 | 150 |
| 1000–1199 | 15 | 2400–2599 | 190 |
| 1200–1399 | 25 | 2600–2799 | 240 |
| 1400–1599 | 40 | 2800–2999 | 300 |
| 1600–1799 | 60 | 3000–3199 | 375 |
| 1800–1999 | 85 | 3200–3399 | 475 |
| 2000–2199 | 115 | 3400–3500 | 600 |

Codeforces accepted submissions are ingested from the provider, normalized to problems and solves, then passed to a database award RPC. The transaction checks eligibility and existing awards, inserts an award and ledger entry, and updates the balance cache. Unique constraints make repeated synchronization safe. The `20261019210000_retroactive_coin_awards.sql` migration changes eligibility for previously accepted solves; consult that migration and the current SQL function before changing policy. A manual client completion cannot bypass provider evidence.

LeetCode difficulty values (Easy 15, Medium 45, Hard 110) appear in product policy, but the current integration lacks reliable per-submission accepted evidence. Its award path remains disabled. Other connected providers have no award path.

The separate `ai_module_awards` table supports a 25-point competitive-module claim. The SQL function requires every lesson ready and completed, a new verified recommended solve with an existing solve award, and no prior use of that solve for another module claim. It uses a transaction advisory lock and uniqueness constraints, then writes a ledger entry and balance update. This is a **practice-backed module bonus**, not a lesson-completion reward. It differs from older product text that forbade all module bonuses; the checked-in SQL is the implemented rule.

Do not add browser-controlled grants or edit the balance cache directly. See [architecture](architecture.md) for the flow and [database](database.md) for integrity boundaries.
