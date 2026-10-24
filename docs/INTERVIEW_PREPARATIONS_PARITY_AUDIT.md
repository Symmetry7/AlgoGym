# Interview Preparations parity audit

Observed and tested 2026-10-24. See [reference evidence](RVE_REFERENCE_PARITY_AUDIT.md) and the [editorial manifest](interview-editorial-manifest.json). The requested RVE skill was unavailable; the installed REA skill's evidence-first method, Computer Use, and Playwright were used instead.

## Company sheets

Every AlgoGym after-count below is backed by the applied Supabase relationship rows and checked by `scripts/interview-catalog-audit.mjs`. **None of these rows establishes question-by-question Hynts or employer-frequency parity.** The Hynts counts are reference directory counts, not copied content.

| Company | Hynts directory | AlgoGym before | AlgoGym after | Verified status |
| --- | ---: | ---: | ---: | --- |
| Google | 55 | 70 | 67 | Partial: editorial track, not verified Hynts membership |
| Meta | 60 | 70 | 80 | Partial: editorial track, not verified Hynts membership |
| Microsoft | 55 | 70 | 80 | Partial: editorial track, not verified Hynts membership |
| Netflix | 50 | 70 | 37 | Partial: editorial track, not verified Hynts membership |
| Amazon | 66 | 70 | 73 | Partial: editorial track, not verified Hynts membership |
| Apple | 55 | 70 | 80 | Partial: editorial track, not verified Hynts membership |
| LinkedIn | 56 | 70 | 80 | Partial: editorial track, not verified Hynts membership |
| Atlassian | 55 | 70 | 65 | Partial: editorial track, not verified Hynts membership |
| Uber | 65 | 70 | 55 | Partial: editorial track, not verified Hynts membership |
| D.E. Shaw | 63 | 70 | 79 | Partial: editorial track, not verified Hynts membership |
| Bloomberg | 62 | 70 | 71 | Partial: editorial track, not verified Hynts membership |
| Tower Research Capital | 58 | 70 | 71 | Partial: editorial track, not verified Hynts membership |
| Stripe | 59 | 70 | 70 | Partial: editorial track, not verified Hynts membership |
| PayPal | 55 | 70 | 73 | Partial: editorial track, not verified Hynts membership |
| Salesforce | 53 | 70 | 80 | Partial: editorial track, not verified Hynts membership |
| Adobe | 53 | 70 | 80 | Partial: editorial track, not verified Hynts membership |
| Flipkart | 54 | 70 | 50 | Partial: editorial track, not verified Hynts membership |
| PhonePe | 50 | 70 | 74 | Partial: editorial track, not verified Hynts membership |
| Meesho | 55 | 70 | 58 | Partial: editorial track, not verified Hynts membership |
| CRED | 58 | 70 | 52 | Partial: editorial track, not verified Hynts membership |
| Razorpay | 50 | 70 | 47 | Partial: editorial track, not verified Hynts membership |
| Zomato | 50 | 70 | 54 | Partial: editorial track, not verified Hynts membership |
| Swiggy | 50 | 70 | 44 | Partial: editorial track, not verified Hynts membership |
| Zepto | 54 | 70 | 56 | Partial: editorial track, not verified Hynts membership |
| Paytm | 50 | 70 | 80 | Partial: editorial track, not verified Hynts membership |
| ServiceNow | 54 | 70 | 80 | Partial: editorial track, not verified Hynts membership |
| Intuit | 53 | 70 | 80 | Partial: editorial track, not verified Hynts membership |
| Walmart | 55 | 70 | 52 | Partial: editorial track, not verified Hynts membership |
| Goldman Sachs | 53 | 70 | 67 | Partial: editorial track, not verified Hynts membership |
| J.P. Morgan Chase | 52 | 70 | 80 | Partial: editorial track, not verified Hynts membership |
| Morgan Stanley | 60 | 70 | 80 | Partial: editorial track, not verified Hynts membership |
| Oracle | 52 | 70 | 70 | Partial: editorial track, not verified Hynts membership |
| Cisco | 54 | 70 | 59 | Partial: editorial track, not verified Hynts membership |
| Visa | 51 | 70 | 80 | Partial: editorial track, not verified Hynts membership |
| Mastercard | 61 | 70 | 80 | Partial: editorial track, not verified Hynts membership |
| Barclays | 57 | 70 | 80 | Partial: editorial track, not verified Hynts membership |
| HSBC | 52 | 70 | 80 | Partial: editorial track, not verified Hynts membership |
| Accenture | 54 | 70 | 80 | Partial: editorial track, not verified Hynts membership |
| TCS + TCS NQT | 75 | 70 | 80 | Partial: editorial track, not verified Hynts membership |
| Infosys | 72 | 70 | 80 | Partial: editorial track, not verified Hynts membership |
| Cognizant | 74 | 70 | 80 | Partial: editorial track, not verified Hynts membership |
| Wipro | 73 | 70 | 80 | Partial: editorial track, not verified Hynts membership |
| HCLTech | 74 | 70 | 80 | Partial: editorial track, not verified Hynts membership |
| Tech Mahindra | 75 | 70 | 80 | Partial: editorial track, not verified Hynts membership |
| Capgemini | 53 | 70 | 80 | Partial: editorial track, not verified Hynts membership |

## Other collections

| Collection | Hynts observed | AlgoGym before | AlgoGym after | Status |
| --- | ---: | ---: | ---: | --- |
| 20 DSA Patterns | 180 | 56 unique | 165 unique public problems | Partial: editorial grouping differs from reference |
| Package Wise DSA | 200 | 200 | 200 | Partial: tier membership not validated against reference |
| SQL | 110 | 8 | 105 free public problems | Partial: different from Hynts compilation |
| System Design | 32 | 10 | 10 | Incomplete; generic source links |
| HR Questions | 100 | 10 | 10 | Incomplete |
| DSA educator sheets | 7 | 3 shortcuts | 3 shortcuts | Incomplete |
| Role Wise | 20 routes | 6 shortcuts | 6 shortcuts | Incomplete |
| Technical interview banks | 28 routes | 8 general questions | 8 general questions | Incomplete |
| Notes | 26 PDF cards | 6 links | 6 links | Incomplete; no licensed PDF library |
| Resume templates | 6 | 3 links | 3 links | Incomplete; no licensed downloadable files |
| Cold email templates | 36 | 8 | 8 | Incomplete |

## Data integrity and tests

- Applied migration `20261024135500_interview_editorial_track_repair.sql` to the linked Supabase project. It backed up previous sheet relationships to a private table and replaced the 45 uniform lists with 3,184 distinct, ordered company placements. It did not delete canonical problems or `interview_user_questions` progress/bookmarks.
- Imported 105 free LeetCode Database problem titles, URLs, and difficulty labels from its public catalog: 55 Easy, 39 Medium, and 11 Hard. No statements, solutions, paid questions, or Hynts compilation were copied. Matching existing SQL IDs retain progress. Hynts' observed 30/40/40 difficulty split is not reproduced.
- Database catalog audit passed after import: 45 companies, 351 canonical questions, 3,184 company placements, no duplicate full company sequence, 165 unique DSA pattern assignments, and 105 SQL assignments. Google now starts Two Sum, Longest Substring, Container With Most Water; Amazon starts Two Sum, LRU Cache, Top K Frequent Elements. These are **AlgoGym editorial selections**.
- Authenticated DB test passed: progress state survived sign-out, reversal worked, another user could not read it, and normal accounts could not edit content.
- Playwright checked directory and Google sheet at 375, 430, 768, 1280, 1440, and 1920 pixels, along with search, difficulty filtering, read-more, package/SQL/system/HR pages, pattern expansion, templates, and resource routes. No overflow or page errors were reported on the isolated production build at port 8097.
- Type check, unit tests (122 passed; 6 skipped), and production build passed. The Supabase migration and DB audit were verified after application.

## Remaining gaps and limitations

The original Hynts company question compilation, popularity rankings, long descriptions, PDFs, and resume assets have no established license for AlgoGym. Public access does not authorize republication. The exact question identity and order for all reference sheets remain unverified and are **not** presented as matched. SQL is expanded but still differs from the reference; system design, HR, educator sheets, roles, topic banks, notes, resumes, and cold emails need separate sourced or original content work. The supplied Pngtree fire image was inspected but excluded from the public build because its commercial-use license is unknown under the [Pngtree content license](https://pngtree.com/content-license-agreement); authenticated streak logic remains in place with the existing icon.
