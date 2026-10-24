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
| SQL | 110 | 8 | 105 free public problems | Partial: different from Hynts compilation |
| System Design | 32 | 10 | 10 | Incomplete; generic source links |
| HR Questions | 100 | 10 | 100 original rehearsal prompts | Partial: different prompts and classification from reference |
| DSA educator sheets | 7 | 3 shortcuts | 3 shortcuts | Incomplete |
| Role Wise | 20 routes | 6 shortcuts | 6 shortcuts | Incomplete |
| Technical interview banks | 28 routes | 8 general questions | 8 general questions | Incomplete |
| Notes | 26 PDF cards | 6 links | 6 links | Incomplete; no licensed PDF library |
| Resume templates | 6 | 3 links | 3 links | Incomplete; no licensed downloadable files |
| Cold email templates | 36 | 8 | 8 | Incomplete |

## Data integrity and tests

- Applied migration `20261024135500_interview_editorial_track_repair.sql` to the linked Supabase project. It backed up previous sheet relationships to a private table and replaced the 45 uniform lists with 3,184 distinct, ordered company placements. It did not delete canonical problems or `interview_user_questions` progress/bookmarks.
- Imported 105 free LeetCode Database problem titles, URLs, and difficulty labels from its public catalog: 55 Easy, 39 Medium, and 11 Hard. No statements, solutions, paid questions, or Hynts compilation were copied. Matching existing SQL IDs retain progress. Hynts' observed 30/40/40 difficulty split is not reproduced.
- Added 90 original AlgoGym HR rehearsal prompts to the existing ten, with topic and difficulty metadata. The shared external resource is labelled as a **general interview guide**; question titles no longer falsely appear as links to individual answers.
- Database catalog audit passed after import: 45 companies, 441 canonical questions, 3,184 company placements, no duplicate full company sequence, 165 unique DSA pattern assignments, 105 SQL assignments, and 100 HR assignments. Google now starts Two Sum, Longest Substring, Container With Most Water; Amazon starts Two Sum, LRU Cache, Top K Frequent Elements. These are **AlgoGym editorial selections**.
- Authenticated DB test passed: progress state survived sign-out, reversal worked, another user could not read it, and normal accounts could not edit content.
- Playwright checked directory and Google sheet at 375, 430, 768, 1280, 1440, and 1920 pixels, along with search, difficulty filtering, read-more, package/SQL/system/HR pages, pattern expansion, templates, and resource routes. No overflow or page errors were reported on the isolated production build at port 8097.
- Type check, unit tests (122 passed; 6 skipped), and production build passed. The Supabase migration and DB audit were verified after application.

## Remaining gaps and limitations

The original Hynts company question compilation, popularity rankings, long descriptions, PDFs, and resume assets have no established license for AlgoGym. Public access does not authorize republication. The exact question identity and order for all reference sheets remain unverified and are **not** presented as matched. SQL and HR are expanded but still differ from the reference; system design, educator sheets, roles, topic banks, notes, resumes, and cold emails need separate sourced or original content work. The supplied Pngtree fire image was inspected but excluded from the public build because its commercial-use license is unknown under the [Pngtree content license](https://pngtree.com/content-license-agreement); authenticated streak logic remains in place with the existing icon.
