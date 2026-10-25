# Interview preparation reference audit

Observed 2026-10-24. The requested **RVE** skill is not installed or connected. The installed `reverse-engineer-anything` (REA) skill was read and its evidence-first workflow applied, but its MCP browser tools are not connected. Browser observations below came from Computer Use and its Playwright DOM interface, not REA instrumentation. This is a bounded audit of public pages; it is not evidence that every individual question or private workflow has been verified.

## Evidence and boundaries

- [Hynts company directory](https://hynts.in/preparation/company-wise-dsa-sheet/) visibly listed 45 companies with the counts below. Its Google sheet rendered 55 rows beginning Two Sum, Longest Substring Without Repeating Characters, Container With Most Water. Hynts' long descriptions, popularity labels, and full question compilation are not licensed for republication here.
- [AlgoGym company directory](https://algogym.vercel.app/interview-preparations/company-wise) visibly listed the same 45 names, each with 70 rows. Its Google sheet began Two Sum, Valid Parentheses, Contains Duplicate, Best Time to Buy and Sell Stock, Reverse Linked List. The API orders stored `interview_sheet_questions` relationships, rather than making the count up in React.
- Root cause in source: `20261022225404_interview_preparations.sql` cross-joined the same first 20 `lc-*` questions to every company. `20261023120152_interview_public_practice_expansion.sql` cross-joined 40 more questions to every company. The middle migration rotates 10 more by company position. This produced a shared opening sequence and a uniform 70, despite the UI describing editorial tracks.
- Current user progress lives in `interview_user_questions` keyed by canonical question ID, separate from sheet relationships. Relationship corrections can preserve those rows, but changing a sheet's denominator will change its displayed completion percentage.

## Company directory counts

These are **published directory counts only**, not independently validated question identities or evidence of employer interview frequency. `Before` is the live AlgoGym directory. A matching target count without verified relationships would be a false pass.

| Company | Hynts directory | AlgoGym before | Individual mapping verified? |
| --- | ---: | ---: | --- |
| Google | 55 | 70 | No |
| Meta | 60 | 70 | No |
| Microsoft | 55 | 70 | No |
| Netflix | 50 | 70 | No |
| Amazon | 66 | 70 | No |
| Apple | 55 | 70 | No |
| LinkedIn | 56 | 70 | No |
| Atlassian | 55 | 70 | No |
| Uber | 65 | 70 | No |
| D.E. Shaw | 63 | 70 | No |
| Bloomberg | 62 | 70 | No |
| Tower Research Capital | 58 | 70 | No |
| Stripe | 59 | 70 | No |
| PayPal | 55 | 70 | No |
| Salesforce | 53 | 70 | No |
| Adobe | 53 | 70 | No |
| Flipkart | 54 | 70 | No |
| PhonePe | 50 | 70 | No |
| Meesho | 55 | 70 | No |
| CRED | 58 | 70 | No |
| Razorpay | 50 | 70 | No |
| Zomato | 50 | 70 | No |
| Swiggy | 50 | 70 | No |
| Zepto | 54 | 70 | No |
| Paytm | 50 | 70 | No |
| ServiceNow | 54 | 70 | No |
| Intuit | 53 | 70 | No |
| Walmart | 55 | 70 | No |
| Goldman Sachs | 53 | 70 | No |
| J.P. Morgan Chase | 52 | 70 | No |
| Morgan Stanley | 60 | 70 | No |
| Oracle | 52 | 70 | No |
| Cisco | 54 | 70 | No |
| Visa | 51 | 70 | No |
| Mastercard | 61 | 70 | No |
| Barclays | 57 | 70 | No |
| HSBC | 52 | 70 | No |
| Accenture | 54 | 70 | No |
| TCS + TCS NQT | 75 | 70 | No |
| Infosys | 72 | 70 | No |
| Cognizant | 74 | 70 | No |
| Wipro | 73 | 70 | No |
| HCLTech | 74 | 70 | No |
| Tech Mahindra | 75 | 70 | No |
| Capgemini | 53 | 70 | No |

## Other public pages

| Surface | Hynts observed | AlgoGym before | Gap |
| --- | --- | --- | --- |
| 20 DSA Patterns | 180 problems in expandable pattern groups | 56 unique | Missing depth and many groups |
| Package Wise DSA | 200 problems; six package tiers; begins Two Sum | 200; six editorial tiers; begins Add Binary | Count matches, membership and tier assignment differ |
| SQL | 110 questions (30 Easy, 40 Medium, 40 Hard) | 8 | Missing question-specific practice |
| System Design | 32 (22 HLD, 10 LLD) | 10 | Missing system-specific references |
| HR | 100 (44 Easy, 41 Medium, 15 Hard) | 10 | Missing original prompts |
| DSA Sheets | Seven educator-specific directories | Three shortcuts | Missing separate resources |
| Role Wise | 20 dedicated role routes | Six shortcuts | Missing role banks |
| Interview Questions | 28 technology routes | Eight general questions | Missing technology banks |
| Notes | 26 PDF cards and category filters | Six links | Missing licensed PDF catalog and viewer |
| Resume Templates | Six preview/download entries | Three external links | Missing licensed files |
| Cold Email Templates | 36 nested entries | Eight general templates | Missing original specialized templates |
| DSA Playlists | Three educator playlists | Small generic directory | Verify exact links |
| Core Subjects | Dedicated subject playlists | Generic resources | Verify exact links |
| System Design Playlists | Six named playlists | Small generic directory | Verify exact links |

## Verification plan

1. Remove the automatic cross-company relationships and retain `interview_user_questions`. Only publish independently sourced, deliberately curated relationships, labeling them editorial until interview frequency evidence exists. Do not change a displayed count without changing rows.
2. Add catalog checks for duplicate full sequences, API counts, ordering, and canonical IDs.
3. Build original or licensed content for categories in separate migrations. Missing source records remain gaps, rather than padded targets.
4. Run live and local browser checks for filters, links, progress, and responsive widths. Authenticated persistence needs an isolated account and must not be inferred from anonymous state.

## Remaining unknowns

- Whether Hynts' company compilation, popularity labels, notes PDFs, or resume files may be licensed for AlgoGym. Public visibility alone does not grant republication rights.
- Complete per-company identities and ordering; the directory count is not a manifest of its rows.
- Actual employer-specific interview frequency. AlgoGym's current public LeetCode metadata proves problem existence, not company association.
- Authenticated progress and bookmark outcomes after relationship changes until tested against a test account.
