# Hynts preparation reference → AlgoGym implementation

Observed on 2026-10-23 with a live browser at [the company directory](https://hynts.in/preparation/company-wise-dsa-sheet/), the [Google sheet](https://hynts.in/preparation/company-wise-dsa-sheet/google-dsa-interview-questions/), the package, patterns, SQL, and system-design sheets, and each linked learning/resource category. This is a layout and interaction study, not a license to copy the source's copy, logos, or question compilation.

## Component map and geometry

| Component | Observed desktop behavior | AlgoGym implementation |
| --- | --- | --- |
| Left rail | Fixed dark rail, approximately 252px; grouped Sheets, Start Learning, Resources; independently scrollable | 252px rail with the same information hierarchy, AlgoGym brand, own progress and return link |
| Top strip | Reference promotional strip above content | 64px functional preparation header without promotional copy |
| Content | Starts roughly 50px from rail; wide, dense area | Responsive 24–64px inset; max 1380px |
| Directory heading | About 30px, medium-heavy, short subheading | 31px with compact line height |
| Search | Approximately 680×48px above grid; updates immediately | 680×48px, local case-insensitive filtering |
| Cards | Four columns at desktop, about 216×157px in inspected 1270px view, 16px gutters, subtle border, compact content | Four-column grid at wide desktop, 3/2/1 at smaller widths; 157px minimum height |
| Detail heading | Company identity, title, summary, read-more, total count | Original monogram and copy, same ordering |
| Progress and filters | Compact progress indicator on left; All, Difficulty, Popularity, Bookmarked on right | Same arrangement, responsive wrap |
| Question table | Dense seven-column rows, approximately 67–70px tall; dark header; checkbox, title, tags, source, difficulty, popularity, bookmark | 67px rows, horizontal scroll on narrow viewports, keyboard-operable controls |

Observed color approximations: background `#09090a`, rail `#0d0d0f`, panels `#111113`, hairline borders near `#29292d`, primary text near `#f3f3f4`, secondary text near `#a4a4ad`. The source uses a dark neutral hierarchy; AlgoGym retains its lavender accent and original identity. The inspected typography was a modern sans with roughly 12–14px dense table/body text. System/Inter-compatible fallback is used in the implementation. Focus uses a visible lavender outline; hover treatments change surface/border without layout shift. Reduced-motion preference disables transitions.

## Interactions observed

- Search `pay` immediately reduced the company directory to PayPal, Razorpay, and Paytm.
- A company card navigated to a dedicated sheet.
- Read More expanded the detail description; Read Less collapsed it.
- Completion checkbox updated the sheet counter and percent (observed Google 0/55 → 1/55, 2%).
- Difficulty menu offered All, Easy, Medium, Hard. Popularity offered All, Very Hot, Hot, Warm, Cold. Bookmarked switched the table view.
- The sidebar linked patterns (accordion groups), package-wise (question table with package filter), SQL and system-design sheets, playlists, role-wise questions, HR, templates, and notes. The reference has content variations, so AlgoGym uses a common preparation rail but specialized resource and question views.

## Directory inventory

45 names were visible: Google, Meta, Microsoft, Netflix, Amazon, Apple, LinkedIn, Atlassian, Uber, D.E. Shaw, Bloomberg, Tower Research Capital, Stripe, PayPal, Salesforce, Adobe, Flipkart, PhonePe, Meesho, CRED, Razorpay, Zomato, Swiggy, Zepto, Paytm, ServiceNow, Intuit, Walmart, Goldman Sachs, J.P. Morgan Chase, Morgan Stanley, Oracle, Cisco, Visa, Mastercard, Barclays, HSBC, Accenture, TCS + TCS NQT, Infosys, Cognizant, Wipro, HCLTech, Tech Mahindra, Capgemini.

The source advertises much larger company-specific sheet counts. AlgoGym seeds **20 publicly linked foundational LeetCode questions per company** as an explicitly labeled starter set. The same canonical questions are intentionally shared across sheets. It does **not** assert that each company asked these questions, import the source's curated rankings, or fabricate popularity. Counts displayed in AlgoGym come from stored assignments. Additional company-specific questions require independent curation and can be added via the admin content editor.

## Before / after design review

| Concern | Reference observation | AlgoGym result |
| --- | --- | --- |
| Visual hierarchy | Compact heading, search, dense four-column list | Preserved the ordering and density with original copy and monograms |
| Navigation | Persistent grouped rail | Preserved the groups and added a mobile drawer and AlgoGym return link |
| Sheet interaction | Progress, filter pills, seven-column question table | Kept compact geometry; keyboard labels, focus outlines, reduced-motion behavior, and responsive table scrolling were added |
| Motion | Subtle hover and control feedback | 140–220ms ease-out transitions on hover, checkbox, drawer, and accordion; no decorative animation |
| Content claims | Company-specific counts and popularity | Actual stored counts; popularity unassigned until supported by independent evidence |

## Data and behavior

- `interview_companies`, `interview_questions`, and `interview_sheet_questions` store published content and placement order. Public RLS exposes only published content.
- `interview_user_questions` stores completion and bookmark flags keyed by `(user_id, question_id)`, so a shared question remains in sync across sheets. Its RLS limits access to the authenticated owner.
- `interview_category_questions` relates the same canonical questions to non-company sheets. The SQL sheet has eight public LeetCode SQL exercises with the same completion/bookmark behavior. The patterns page groups 30 public DSA exercises into 20 named expandable patterns plus an additional-practice group. The package view currently uses the foundational DSA bank by difficulty because verified salary-band associations are unavailable.
- `/api/interview` reads public catalog and user-specific state; PATCH requires authentication and validates state; POST requires platform-admin authorization, validates metadata, and handles content/placement edits. The service key remains server-side.
- Completion is self-reported. There is no automatic LeetCode verdict verification. The popularity filter remains available for future independently sourced editorial data, and currently no starter question is assigned a popularity badge.
- Static learning/resource links point to public source material; the linked sites control their own content and licensing. Their full articles/playlists are not copied into AlgoGym.

## Verification checklist

Browser QA should compare the directory and Google sheet at 375×812, 430×932, 768×1024, 1280×800, 1440×900, and 1920×1080. Check card density, sidebar/mobile drawer, table scrolling, filter interactions, live count, focus, empty/error/loading states, and persistence after refresh. The implementation should also pass typecheck, tests, and production build. Any difference in logos, copy, and counts is intentional to respect content ownership and data truth.
