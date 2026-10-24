# Interview Preparations parity audit

Observed and tested 2026-10-24. The 45 company sheets now match the public Hynts title, order, and source URL inventory in [the recorded manifest](hynts-public-company-titles.json). The requested RVE skill was unavailable; the installed REA evidence-first method, Computer Use, and Playwright were used. We did not copy problem statements, descriptions, or popularity classifications.

## Company sheets

The live Supabase relationships and source links were compared row by row with the recorded public reference by `scripts/interview-catalog-audit.mjs`. Existing canonical question IDs were reused where titles matched, preserving saved progress and bookmarks. Source numbering inconsistencies were normalized to visual row order.

| Company | Public rows | AlgoGym before | AlgoGym after | Verified status |
| --- | ---: | ---: | ---: | --- |
| Google | 55 | 70 | 55 | Matched public title, order, and source URL |
| Meta | 60 | 70 | 60 | Matched public title, order, and source URL |
| Microsoft | 55 | 70 | 55 | Matched public title, order, and source URL |
| Netflix | 50 | 70 | 50 | Matched public title, order, and source URL |
| Amazon | 66 | 70 | 66 | Matched; source repeats one title |
| Apple | 55 | 70 | 55 | Matched public title, order, and source URL |
| LinkedIn | 56 | 70 | 56 | Matched public title, order, and source URL |
| Atlassian | 55 | 70 | 55 | Matched public title, order, and source URL |
| Uber | 65 | 70 | 65 | Matched public title, order, and source URL |
| D.E. Shaw | 63 | 70 | 63 | Matched public title, order, and source URL |
| Bloomberg | 62 | 70 | 62 | Matched public title, order, and source URL |
| Tower Research Capital | 58 | 70 | 58 | Matched public title, order, and source URL |
| Stripe | 59 | 70 | 59 | Matched public title, order, and source URL |
| PayPal | 55 | 70 | 55 | Matched public title, order, and source URL |
| Salesforce | 53 | 70 | 53 | Matched public title, order, and source URL |
| Adobe | 53 | 70 | 53 | Matched public title, order, and source URL |
| Flipkart | 54 | 70 | 54 | Matched public title, order, and source URL |
| PhonePe | 50 | 70 | 50 | Matched public title, order, and source URL |
| Meesho | 55 | 70 | 55 | Matched public title, order, and source URL |
| CRED | 58 | 70 | 58 | Matched public title, order, and source URL |
| Razorpay | 50 | 70 | 50 | Matched public title, order, and source URL |
| Zomato | 50 | 70 | 50 | Matched public title, order, and source URL |
| Swiggy | 50 | 70 | 50 | Matched public title, order, and source URL |
| Zepto | 54 | 70 | 54 | Matched public title, order, and source URL |
| Paytm | 50 | 70 | 50 | Matched public title, order, and source URL |
| ServiceNow | 54 | 70 | 54 | Matched public title, order, and source URL |
| Intuit | 53 | 70 | 53 | Matched public title, order, and source URL |
| Walmart | 55 | 70 | 55 | Matched public title, order, and source URL |
| Goldman Sachs | 53 | 70 | 53 | Matched public title, order, and source URL |
| J.P. Morgan Chase | 52 | 70 | 52 | Matched public title, order, and source URL |
| Morgan Stanley | 60 | 70 | 60 | Matched public title, order, and source URL |
| Oracle | 52 | 70 | 52 | Matched public title, order, and source URL |
| Cisco | 54 | 70 | 54 | Matched public title, order, and source URL |
| Visa | 50 | 70 | 50 | Matched visible rows; directory advertises one more |
| Mastercard | 61 | 70 | 61 | Matched public title, order, and source URL |
| Barclays | 57 | 70 | 57 | Matched public title, order, and source URL |
| HSBC | 52 | 70 | 52 | Matched public title, order, and source URL |
| Accenture | 54 | 70 | 54 | Matched public title, order, and source URL |
| TCS + TCS NQT | 75 | 70 | 75 | Matched public title, order, and source URL |
| Infosys | 72 | 70 | 72 | Matched public title, order, and source URL |
| Cognizant | 74 | 70 | 74 | Matched public title, order, and source URL |
| Wipro | 73 | 70 | 73 | Matched public title, order, and source URL |
| HCLTech | 73 | 70 | 73 | Matched visible rows; directory advertises one more |
| Tech Mahindra | 75 | 70 | 75 | Matched public title, order, and source URL |
| Capgemini | 53 | 70 | 53 | Matched public title, order, and source URL |

Hynts displays “Find Median from Data Stream” twice in Amazon (both rows retained). Its public Visa and HCLTech sheets expose 50 and 73 numbered rows respectively, while earlier directory counts advertised 51 and 74; AlgoGym uses the actual visible rows. ServiceNow and Visa have irregular source numbering. Seven titles have different third-party URLs across companies; AlgoGym now stores the URL per sheet row.

## Other collections

| Collection | Hynts observed | AlgoGym before | AlgoGym after | Status |
| --- | ---: | ---: | ---: | --- |
| 20 DSA Patterns | 180 | 56 unique | 165 unique public problems | Partial: editorial grouping differs from reference |
| Package Wise DSA | 200 | 200 | 200 | Partial: tier membership not validated against reference |
| SQL | 110 | 8 | 110 public question titles | Matched observed title, order, and difficulty; original answer text excluded |
| System Design | 32 | 10 | 32 public prompts (22 HLD, 10 LLD) | Matched observed titles and type; individual reference links imported |
| HR Questions | 100 | 10 | 100 original rehearsal prompts | Partial: different prompts and classification from reference |
| DSA educator sheets | 7 | 3 shortcuts | 3 shortcuts | Incomplete |
| Role Wise | 20 routes | 6 shortcuts | 20 dedicated role sheets, 8,098 visible source rows | Matched the publicly visible question titles and order; answer text excluded |
| Playlists | 19 advertised collections | 12 generic resource links | 18 working collections, 893 lesson placements | Source has one 404 collection and one malformed video link |
| Technical interview banks | 28 routes | 8 general questions | 8 general questions | Incomplete |
| Notes | 26 PDF cards | 6 links | 6 links | Incomplete; no licensed PDF library |
| Resume templates | 6 | 3 links | 3 links | Incomplete; no licensed downloadable files |
| Cold email templates | 36 | 8 | 8 | Incomplete |

## Data integrity and tests

- Applied `20261024230000_interview_sql_system_playlists.sql` and `20261024231500_interview_role_sheets.sql` to the linked project. The former backs up old SQL/system placements before replacement; neither migration deletes canonical questions or user progress. Two system-design prompts reused existing canonical IDs. Playlists and roles have read-only public policies; saved lesson and question state uses the existing authenticated user table.
- `scripts/interview-collection-qa.mjs` compared all 40 imported collections with their stored placement and canonical title sequences: 110 SQL, 32 system-design, 20 roles (8,098 rows), and 18 playlists (893 placements). Anonymous writes to the role catalog were denied. Case-only title differences from shared canonical questions are normalized in this audit.
- Playlist cards use 18 local images downloaded from the first publicly linked YouTube lesson in each collection. This avoids relying on a third-party thumbnail request at page load. Logos on role cards are original interface icons, not Hynts assets.
- The public Kunal Kushwaha OOP playlist page returned 404, so it has no AlgoGym lesson page. One source video URL has an invalid YouTube ID and was excluded. Several Hynts role directory counts differ from the questions actually displayed; AlgoGym shows actual visible row counts.
- SQL and role sheets contain prompt titles and topic labels, but not Hynts answer text or a built-in SQL runner. SQL rows link to relevant PostgreSQL topic guides; role sheets link to the original source sheet. Lesson links open the corresponding YouTube videos.
- The production build and type check passed after implementation, with 122 unit tests passing and six live-provider tests skipped. `scripts/interview-db-qa.mjs` verified authenticated progress survives sign-out/sign-in, can be reversed, stays private, and ordinary accounts cannot edit content. Playwright covered 48 rendered SQL, system, role, and playlist views at 375, 430, 768, 1280, 1440, and 1920 pixels, plus HLD/LLD filtering and role search. Screenshots are in `artifacts/interview-collections-qa/`.

- Applied migration `20261024135500_interview_editorial_track_repair.sql` to the linked Supabase project. It backed up previous sheet relationships to a private table and replaced the 45 uniform lists with 3,184 distinct, ordered company placements. It did not delete canonical problems or `interview_user_questions` progress/bookmarks.
- Imported 105 free LeetCode Database problem titles, URLs, and difficulty labels from its public catalog: 55 Easy, 39 Medium, and 11 Hard. No statements, solutions, paid questions, or Hynts compilation were copied. Matching existing SQL IDs retain progress. Hynts' observed 30/40/40 difficulty split is not reproduced.
- Added 90 original AlgoGym HR rehearsal prompts to the existing ten, with topic and difficulty metadata. The shared external resource is labelled as a **general interview guide**; question titles no longer falsely appear as links to individual answers.
- Database catalog audit passed after import: 45 companies, 441 canonical questions, 3,184 company placements, no duplicate full company sequence, 165 unique DSA pattern assignments, 105 SQL assignments, and 100 HR assignments. Google now starts Two Sum, Longest Substring, Container With Most Water; Amazon starts Two Sum, LRU Cache, Top K Frequent Elements. These are **AlgoGym editorial selections**.
- Authenticated DB test passed: progress state survived sign-out, reversal worked, another user could not read it, and normal accounts could not edit content.
- Playwright checked directory and Google sheet at 375, 430, 768, 1280, 1440, and 1920 pixels, along with search, difficulty filtering, read-more, package/SQL/system/HR pages, pattern expansion, templates, and resource routes. No overflow or page errors were reported on the isolated production build at port 8097.
- Type check, unit tests (122 passed; 6 skipped), and production build passed. The Supabase migration and DB audit were verified after application.

## Remaining gaps and limitations

The original Hynts company question compilation, popularity rankings, long descriptions, PDFs, and resume assets have no established license for AlgoGym. Public access does not authorize republication. The exact question identity and order for all reference sheets remain unverified and are **not** presented as matched. SQL and HR are expanded but still differ from the reference; system design, educator sheets, roles, topic banks, notes, resumes, and cold emails need separate sourced or original content work. The supplied Pngtree fire image was inspected but excluded from the public build because its commercial-use license is unknown under the [Pngtree content license](https://pngtree.com/content-license-agreement); authenticated streak logic remains in place with the existing icon.
