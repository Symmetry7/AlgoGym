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
| 20 DSA Patterns | 180 placements | 56 unique | 180 linked placements, 178 canonical problems | Matched public topic, subsection, order, and LeetCode URL inventory |
| Package Wise DSA | 200 | 200 | 200 | Partial: tier membership not validated against reference |
| SQL | 110 | 8 | 110 prompts with original PostgreSQL answers | Matched observed title, order, and difficulty; answer code is AlgoGym-authored |
| System Design | 32 | 10 | 32 prompts (22 HLD, 10 LLD) | Matched titles and type; article and video links shown separately; Easy/Medium/Hard is AlgoGym guidance |
| HR Questions | 100 | 10 | 100 reference prompt titles with original sample responses | Matched observed title, order, and difficulty; response text is AlgoGym-authored |
| DSA educator sheets | 7 | 3 shortcuts | 3 shortcuts | Incomplete |
| Role Wise | 20 routes | 6 shortcuts | 20 dedicated role sheets, 8,098 visible source rows | Matched the publicly visible question titles and order; answer text excluded |
| Playlists | 19 advertised collections | 12 generic resource links | 18 working collections, 893 lesson placements | Source has one 404 collection and one malformed video link |
| Technical interview banks | 28 routes | 8 general questions | 28 topic sheets, 4,531 public question placements | Matched visible question titles, order, and difficulty; original answers not copied |
| Notes | 26 PDF cards | 6 links | 26 original readable notes with Markdown downloads | Functional library; reference PDFs were not copied |
| Resume templates | 6 | 3 links | 6 original previewable, editable HTML templates | Functional preview/download/print; reference artwork was not copied |
| Cold email templates | 36 | 8 | 36 editable original templates | Functional search, copy, and editing; text is not copied |

## Data integrity and tests

- Applied `20261024230000_interview_sql_system_playlists.sql` and `20261024231500_interview_role_sheets.sql` to the linked project. The former backs up old SQL/system placements before replacement; neither migration deletes canonical questions or user progress. Two system-design prompts reused existing canonical IDs. Playlists and roles have read-only public policies; saved lesson and question state uses the existing authenticated user table.
- `scripts/interview-collection-qa.mjs` compared all 40 imported collections with their stored placement and canonical title sequences: 110 SQL, 32 system-design, 20 roles (8,098 rows), and 18 playlists (893 placements). Anonymous writes to the role catalog were denied. Case-only title differences from shared canonical questions are normalized in this audit.
- Playlist cards use 18 local images downloaded from the first publicly linked YouTube lesson in each collection. This avoids relying on a third-party thumbnail request at page load. Logos on role cards are original interface icons, not Hynts assets.
- The public Kunal Kushwaha OOP playlist page returned 404, so it has no AlgoGym lesson page. One source video URL has an invalid YouTube ID and was excluded. Several Hynts role directory counts differ from the questions actually displayed; AlgoGym shows actual visible row counts.
- SQL includes original example queries and a copy action, but no built-in SQL runner. Role sheets link to the original source sheet, and playlist lessons open the corresponding YouTube videos.
- Applied `20261025090000_interview_patterns_180.sql`, `20261025091500_interview_answers_resources.sql`, and `20261025093000_interview_pattern_link_correction.sql`. The first two back up prior pattern/HR placements in the private schema before replacing them; no saved user state is deleted. The correction separates a LeetCode “Design Twitter” exercise from a same-title system-design article so both links remain accurate.
- `scripts/interview-answer-qa.mjs` verified all 180 pattern placements (178 canonical URLs), 110 SQL answers, 100 HR answers, 32 system-design article/video pairs and difficulty labels, plus denial of anonymous answer edits. SQL samples use an explicitly stated illustrative PostgreSQL schema; HR examples use replaceable placeholders and avoid inventing a student's experience. Hynts answer text was not copied.
- The production build and type check passed after implementation, with 122 unit tests passing and six live-provider tests skipped. `scripts/interview-db-qa.mjs` verified authenticated progress survives sign-out/sign-in, can be reversed, stays private, and ordinary accounts cannot edit content. Playwright covered 60 rendered SQL, system, HR, pattern, role, and playlist views at 375, 430, 768, 1280, 1440, and 1920 pixels, plus answer expansion, pattern expansion, HLD/LLD filtering, and role search. Screenshots are in `artifacts/interview-collections-qa/`. A screenshot review caught an illegible wordmark in the interview header; a targeted 375px retest verified the corrected original AlgoGym wordmark.

- Applied migration `20261024135500_interview_editorial_track_repair.sql` to the linked Supabase project. It backed up previous sheet relationships to a private table and replaced the 45 uniform lists with 3,184 distinct, ordered company placements. It did not delete canonical problems or `interview_user_questions` progress/bookmarks.
- The earlier 105 LeetCode SQL entries and 100 AlgoGym HR rehearsal prompts remain stored as historical canonical records, but the active sheets now use the 110 and 100 reference prompt inventories above. Existing user progress records are retained; unmatched historical prompts remain accessible through saved progress, rather than being guessed onto different new questions.
- The earlier company catalog audit passed after import: 45 companies and 3,184 company placements, with no duplicate full company sequence. Its 165-pattern and 105-SQL figures were the old state; the current live audit above verifies 180 pattern placements and 110 SQL rows. Google and Amazon use distinct, reference-ordered company rows.
- Authenticated DB test passed: progress state survived sign-out, reversal worked, another user could not read it, and normal accounts could not edit content.
- Playwright checked directory and Google sheet at 375, 430, 768, 1280, 1440, and 1920 pixels, along with search, difficulty filtering, read-more, package/SQL/system/HR pages, pattern expansion, templates, and resource routes. No overflow or page errors were reported on the isolated production build at port 8097.
- Type check, unit tests (122 passed; 6 skipped), and production build passed. The Supabase migration and DB audit were verified after application.

## 2026-10-25 technical and resource expansion

- The public [technical question index](https://hynts.in/preparation/most-asked-questions/) was inspected topic by topic. `data/interview-technical-reference.json` records 28 sheets and 4,531 visible question placements. The additive migration `20261025110000_interview_technical_questions.sql` creates 4,242 canonical questions and connects them to the sheets. Existing canonical IDs are reused when titles match, preserving user state. The public OOP sheet has 149 visible questions although the directory advertises 150; PostgreSQL has 77 visible questions although the directory advertises 79. AlgoGym reports visible rows.
- Technical sheets have search, difficulty and bookmark filters, progress controls, pagination, and direct SYMM AI context handoff. The question detail now displays an original AlgoGym answer. For a missing cached answer, a signed-in reader triggers server-side AI-assisted writing; the answer is validated, saved by canonical question ID, and subsequently visible to everyone. The external reference-sheet action is removed from this panel. This is an incremental answer library: unanswered questions require the first signed-in request and a working AI provider.
- The notes library contains 26 original short study notes with search, topic filters, in-page reading, Markdown download, and print/PDF through the browser. These are not the reference PDFs. Resume templates offer six original layouts with previews, editable HTML downloads, and print/PDF. Cold emails offer 36 original editable templates with search and copy.
- My Progress uses the authenticated user's saved question state. It reports completed, bookmarked, and revisit counts; a difficulty breakdown; a seven-day view of saved-state changes; and recently touched questions. The chart is explicitly labeled as saved-state activity, not verified solve history. Relevant preparation pages offer SYMM AI links that prefill a topic without changing the approved chat design.
- `scripts/interview-technical-db-qa.mjs` passed for all 28 sheets and 4,531 placements, with anonymous writes denied. `scripts/interview-progress-browser-qa.mjs` passed with a temporary authenticated account, including saved-state statistics and SYMM topic handoff. `scripts/interview-expanded-qa.mjs` passed 54 page/viewport combinations at 375, 430, 768, 1280, 1440, and 1920 pixels; search, expansion, resource downloads, and signed-out access behavior were exercised. Screenshots are in `artifacts/interview-expanded-qa/`. Production build and 122 unit tests passed; six live-provider tests were skipped.

## Remaining gaps and limitations

Hynts' long-form explanations, original answer text, PDFs, and resume assets have no established reuse license for AlgoGym. SQL and HR answers here are original examples, not copied text or a runnable judge. Package-wise mapping and educator sheets still need source-by-source validation. The new notes, resumes, and email templates are original replacements rather than copied Hynts files or text. The supplied Pngtree fire image remains excluded from the public build because its commercial-use license is unknown under the [Pngtree content license](https://pngtree.com/content-license-agreement); authenticated streak logic remains in place with the existing icon.

The technical answer cache uses `interview_question_content`, and `interview_answer_requests` records generation attempts for per-user limits (three per minute, 25 per rolling day). Answer text is original AI-assisted material, not a claim of editorial or reference-source verification. Provider outages show a retryable error; cached answers remain readable.

The 2026-10-25 answer check used a temporary authenticated account to open the first DBMS question. The Gemini response was shown in the expanded row and persisted; a separate anonymous request then read the same cached answer. An anonymous attempt to write a generation record was denied. The production build passed, and `server/interview-answer.spec.ts` verified structured answers and rejection of malformed output. Screenshot: `artifacts/interview-expanded-qa/dbms-original-answer-1280.png`.
