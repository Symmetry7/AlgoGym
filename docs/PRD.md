# Algogym — Product Requirements Document (PRD)

**Version:** 1.0 · **Date:** 24 Nov 2026 · **Owner:** Aditya Kumar Tiwari · **Status:** Draft for review

Related docs: [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) · [DESIGN.md](./DESIGN.md)

---

## 1. Summary

Algogym is an interview-preparation platform for students and working developers in India. Users follow step-by-step roadmaps, learn each topic for free, and solve problems inside Algogym's own workspace — no jumping to other sites.

- **Learning model:** TensorTonic-style roadmaps. Every roadmap node opens a free lesson, and every lesson leads into that topic's problems.
- **Practice model:** a LeetCode-style problem bank and in-browser workspace, with company-wise prep.
- **Look and feel:** Resend-style marketing site (pure black, light beams, serif headlines, glass cube) with an emerald accent.
- **Business model:** learning is free; students pay for Pro; interviewers and colleges pay monthly for Rooms (v1.1).

## 2. Problem

Interview prep in India is scattered across LeetCode, GFG, YouTube playlists, PDFs and Telegram groups. Students jump between tabs, don't know what to study next, and can't tell which questions their target company asks. Interviewers and placement cells build tests from scratch every time.

## 3. Target users

| Persona | Situation | Needs |
| --- | --- | --- |
| Final-year student, tier-2/3 college | Placements in 3 months, weak DSA | A clear order of topics, free lessons, practice in one place |
| Working developer (1–5 yrs) | Switching to a product company | Company-specific questions, patterns, fast revision |
| Hiring engineer at a startup (v1.1) | Screens 10–30 candidates a month | A quick coding round from a trusted bank |
| Placement coordinator (v1.1) | Runs tests for hundreds of students | Private rooms, ready-made problems, results report |

## 4. Decisions log

| Area | Decision |
| --- | --- |
| Launch scope (v1.0) | DSA roadmap + 16-pattern roadmap, free Learn lessons, problem bank + workspace, Company prep, HR/SQL interview prep, study plans, My Prep, Student Pro |
| Rooms | v1.1, about 4 weeks after launch, monthly plans |
| Arena (1v1 duels) | Not built; nav item with "Soon" badge and waitlist page |
| Stack | Next.js + Supabase (Postgres, Auth) on Vercel + one Express "engine" service on Railway |
| Judge | Hosted Judge0 (RapidAPI), called only by the engine; swappable for self-hosted later |
| Languages | JavaScript, Python, C++, Java |
| Platform | Web only (mobile-responsive); no native app in the next 6 months |
| Existing users | Production has real users: migrate accounts, archive old tables, additive migrations only |
| Student Pro | ₹199/month or ₹1,499/year |
| Rooms pricing | Starter ₹999/month (25 candidates), Pro ₹2,999/month (100 candidates), Colleges: custom |
| Design | Resend-style dark site, emerald #22C55E for buttons and highlights, pre-rendered glass cube loop |
| Hero | Pure Resend layout: badge, serif headline, subtext, two buttons, cube |
| Architecture diagram | Eraser, plus Mermaid inside SYSTEM_ARCHITECTURE.md |
| Icons | Devicon (languages/tech), Simple Icons (company and source logos), Lucide (UI glyphs); self-hosted, monochrome by default |
| Fonts | Instrument Serif (display) + Geist / Geist Mono |
| UI quality gate | Impeccable skill in Claude Code (`/critique`, `/audit`, `/polish`) + `npx impeccable detect` in CI on every UI change |
| Interview Preparation section | Existing section kept and migrated, never deleted |
| Team and timeline | Small team, public launch in ~6 weeks |

## 5. Scope

### v1.0 — Practice launch (week 6)
- Resend-style landing page and pricing page
- New app UI (dark, emerald accent)
- Roadmaps: DSA and 16 Patterns, with 3D-style topic nodes
- Learn: one free lesson per roadmap topic, with visuals and a checkpoint quiz
- Problems: LeetCode-style list page with source badges and company chips
- Workspace: Monaco editor, Run and Submit through Judge0
- Companies: company pages with 30/60/90-day and all-time lists
- Interview Prep: existing HR and SQL content migrated
- Study plans, My Prep dashboard, notes, bookmarks, My Lists, daily problem
- Student Pro via Razorpay
- Arena coming-soon page with waitlist; Credits page

### v1.1 — Rooms (weeks 7–10)
- Organisations, interviewer seats, private rooms
- Problems picked only from the Algogym bank, from a hidden room-only pool
- Candidate invite links, time limit, auto-graded report
- Monthly Rooms plans via Razorpay

### Later
- Arena 1v1 duels (realtime on the engine)
- Tracks: System Design, ML/AI, SQL execution, Backend, Frontend, CS fundamentals
- AI hints

### Removed from the old Algogym
Onboarding flow, ID/college verification, external solve tracking (provider sync, coding_profiles, Codeforces sync, upsolve, sheets), Training Gym, Chakra coin economy, Symm AI, leaderboard and ranks, community features, contests, old three.js landing. Their tables are archived, not dropped.

## 6. User stories (v1.0)

1. **Sign up fast.** As a student I sign up with Google or email and land on the roadmap.
   - No onboarding screens; profile fields optional in Settings.
2. **Know what's next.** As a student I see the DSA roadmap and my current step.
   - Current node highlighted; "Continue" opens my next lesson or problem.
3. **Learn for free.** As a student I click a roadmap node and read its lesson without paying or signing in.
   - Lesson ends with a 3-question quiz and "Practice this".
4. **Solve in place.** As a student I open any playable problem inside Algogym. At launch every playable problem is an Algogym original.
   - No external tab for solving. LeetCode/GFG problems appear as metadata rows with a source badge, company tags, "View original" and, when one exists, "Similar Algogym problem".
5. **Run and submit.** As a student I run code on sample cases and submit against hidden tests.
   - Verdict and runtime per case, plus peak memory for the run, in about 5 seconds. Cases that didn't run before the time limit show as "Not run".
6. **Prepare for a company.** As a developer I see which problems a company asked recently.
   - All-time list free; 30/60/90-day lists and frequency for Pro.
7. **Revise HR and SQL.** As a student I use the migrated HR and SQL answers, filtered by company and role.
8. **Track progress.** As a user I see progress, streak, notes, bookmarks and my lists in My Prep.
9. **Upgrade.** As a user I pay with UPI or card and locked items unlock within a minute.
10. **Arena interest.** As a user I join the Arena waitlist.

## 7. Feature requirements

### 7.1 Marketing site
**Landing page (/)** — Resend structure, interview-prep content. Section order:

| # | Section | Content |
| --- | --- | --- |
| 1 | Nav | Logo · Features ▾ (Roadmaps, Learn, Problems, Companies, Workspace) · Companies · Pricing · Arena (Soon) · Log in · **Get started** (emerald) |
| 2 | Hero | Small pill badge ("New: Company prep 2026 ›") · large serif headline, e.g. "Interview prep for developers" · one-line subtext · **Get started** + "Explore roadmap" · glass cube loop with light beam |
| 3 | Trust strip | "Practice questions reported from interviews at" + company wordmarks (greyscale, no endorsement implied) |
| 4 | Learn | Heading "Learn" · tabs by track (DSA, Patterns, SQL, HR; System Design "Soon") · live lesson preview with a step-through visual |
| 5 | Practice experience | Heading "A real coding workspace" · bento: workspace preview where Run streams case results ("Case 1 ✓ 12 ms"), roadmap card, hints card |
| 6 | Roadmaps | Winding path preview with 3D nodes and the right-side topic panel |
| 7 | Practice by company | Company cards with problem counts and top patterns |
| 8 | Feature grid | 9 short items: in-browser judge, 4 languages, hidden tests, hints, editorials, notes, bookmarks, streak, free lessons |
| 9 | Testimonials | Real quotes only. Hidden until we have permission-backed quotes from real users |
| 10 | My Prep preview | Tabs: Progress · Streak · Companies, each with a dashboard screenshot |
| 11 | Arena teaser | "1v1 duels are coming" + Join waitlist |
| 12 | Final CTA + footer | Headline + Get started; footer links incl. Credits, Terms, Privacy |

**Pricing page (/pricing)** — Resend pricing layout:
- Serif "Pricing" title, subtext "Learn free. Upgrade when you're ready."
- Segmented toggle: **For learners** | **For interviewers & colleges**. Monthly / Yearly switch.
- Learner cards: **Free** ₹0 · **Pro** ₹199/mo or ₹1,499/yr.
- Interviewer cards: **Rooms Starter** ₹999/mo (25 candidates) · **Rooms Pro** ₹2,999/mo (100 candidates) · **Colleges** Custom ("Contact us"). Until v1.1 ships, this tab shows "Launching soon" and a waitlist button.
- Comparison tables grouped by category (Learning, Practice, Company prep, Rooms, Support), ✓ or values per tier.
- FAQ accordion (payment methods incl. UPI, refunds, student discount, GST, cancelling).

### 7.2 Auth
- Supabase Auth: Google and email (magic link or password). Existing users keep their accounts.
- After sign-in → /roadmap (or the page they came from). No onboarding.

### 7.3 Roadmaps (/roadmap, /roadmap/[track]) — modelled on TensorTonic
- Track switcher (DSA, Patterns live; others "Soon") and Essentials/Complete toggle.
- Left canvas: winding dotted path, one 3D-style isometric icon per topic, pill label "Topic · solved/total", layer headings ("Layer 1 · Foundations").
- Node states: not started · lesson read · complete (check). Selected node glows emerald.
- Right sticky panel: layer + step counter, title, "N problems · M solved", segmented progress bar, **Learn** and **Practice** buttons, "What's inside" list (source badge, difficulty, lock icon), "About this roadmap".
- DSA layers: Foundations (Complexity, Arrays & Strings, Hashing) → Core Patterns (Two Pointers, Sliding Window, Binary Search, Stack/Queue) → Linked Lists & Recursion → Trees & Graphs → DP & Greedy → Advanced (Tries, Heaps, Union-Find).

### 7.4 Learn (/roadmap/[track]/[topic]) — free
- Lesson page with a slim roadmap rail on the left (layer, previous/next topic, progress).
- Lesson content: concept, intuition diagram, interactive step-through visual, worked example, code in 4 languages, complexity, common mistakes, 3-question quiz, "Practice this".
- A topic is complete when the lesson is read, the quiz passed and its free problems solved.
- Readable without sign-in, server-rendered for Google; progress saves after sign-in.

### 7.5 Problems (/problems) — LeetCode-style layout
- Left sidebar: Library, Roadmaps, Learn, Study Plans, Companies; "My Lists" (Favorites + user lists, + button).
- Top banner strip: 2–3 rotating cards.
- Topic tag row with counts + Expand; category pills: All Topics, DSA, SQL, System Design, HR, Patterns.
- Toolbar: search, sort, filter (difficulty, status, company, pattern, source, Pro), "X / Y Solved" ring, shuffle to a random unsolved problem.
- Rows: status, number + title, source badge, acceptance %, difficulty colour, company frequency bars (blurred for Free), lock on Pro problems.
- LeetCode/GFG rows are metadata only: they open "View original" and show "Similar Algogym problem" when one is linked; they have no workspace at launch.
- Right sidebar: Daily Problem calendar (streak only), Trending Companies with search and counts, Your Progress card.
- Not included: coins, rewards, contests, friends. Acceptance % hidden until 50+ submissions.

### 7.6 Workspace (/problems/[slug]) — modelled on TensorTonic's problem page
> Layout and visual spec: DESIGN.md §6.6, floating panels (DECISIONS.md 2026-11-26). It supersedes the split pane below. The features listed here still apply.

- Top bar: problem-list drawer, prev/next, breadcrumb, source badge + "View original".
- Resizable, collapsible split pane.
- Left tabs: Description · Theory · Solution (Pro) · Submissions · Notes · Report.
- Description: statement (Markdown + KaTeX), examples, hints, constraints (time/memory), "Asked at" chips, optional interactive visual, similar problems.
- Right: Monaco (JS/Python/C++/Java), reset, copy, settings, **Run**, **Submit**; bottom panel with Testcase / Test Result tabs, case chips, add custom case, per-case verdict and runtime (peak memory per run; "Not run" for cases past the time limit); drafts autosave.
- Locked problem: statement preview + upgrade card instead of the editor.
- System Design and HR problems: written-answer editor + rubric checklist + model answer.

### 7.7 Companies (/companies, /companies/[slug])
- Grid of company cards (logo, problem count, top patterns).
- Company page: All-time (free) and 30/60/90-day tabs (Pro), frequency bars, difficulty split, most-asked patterns, company progress, that company's HR questions.

### 7.8 Interview Prep (/interview)
Existing content migrated into the new UI: HR/Behavioral and SQL answers, filterable by company and role.

### 7.9 Study plans, My Prep, lists
- Study plans: Top 75 Essentials, 16 Patterns, Company sprints (e.g. Amazon 30 days); ordered modules with progress.
- My Prep: continue where you left off, progress per track and company, streak heatmap, recently solved, bookmarks, lists.

### 7.10 Billing
- Razorpay subscriptions (UPI, cards), monthly and yearly; webhook updates entitlements within a minute; receipts by email; cancel anytime.

### 7.11 Arena (/arena) and Credits (/credits)
- Arena: explainer + "Notify me" waitlist.
- Credits: every external source with its licence, including Devicon (MIT), Simple Icons (CC0) and Lucide (ISC).

### 7.12 Rooms (v1.1)
- Organisation with owner and interviewer seats.
- Create room: pick problems from the hidden room-only pool, set time limit and language list, invite candidates by link or email.
- Candidate takes the round in a locked-down workspace (no hints, no solutions, timer).
- Report per candidate: problems solved, tests passed, time, code, plagiarism flag (similar submissions).
- Plan limits enforced: candidates per month (25 / 100 / custom).

## 8. Content and sourcing

- **Launch target:** 60 fully playable DSA problems; one lesson per DSA topic + 16 pattern lessons; company pages for the top 30 companies; all existing HR/SQL content.
- **Launch rule: playable problems are Algogym originals only.** Our own task, statement, examples, tests and editorial.
- **LeetCode/GFG problems at launch are metadata only:** source, source number, URL, companies (frequency, timeframe), topics, patterns. They appear on the Companies and Problems pages with a source badge, company tags, "View original", and "Similar Algogym problem" when one is linked. No statement text is stored or shown.
- **After launch:** adapted statements (our own words, same task and I/O, our own examples, tests and editorial), highest company frequency first.
- **Problem states:** `original` (playable) · `pending` (metadata only) · `adapted` (after launch).
- **Each playable problem:** statement, 2–3 examples, constraints, hints, starter code in 4 languages, ≥10 hidden tests incl. edge cases, editorial with complexity; reviewed by a second person.

| Source | Licence | Use |
| --- | --- | --- |
| liquidslr/leetcode-company-wise-problems | None stated | Metadata import only (title, number, difficulty, company, frequency, timeframe) |
| algorithm-visualizer | MIT | Model for our own step-through visual component; credited |
| TheAlgorithms/Java | MIT | Reference Java solutions; credited |
| Chanda-Abdul coding patterns | None stated; based on Grokking course | Pattern names only; lessons written by us |
| hello-algo | CC BY-NC-SA 4.0 | Further-reading links until the author gives written permission |
| Existing Algogym Interview Prep | Ours | Migrated in full |

## 9. Monetization

| Feature | Free | Pro ₹199/mo · ₹1,499/yr |
| --- | --- | --- |
| Learn lessons | All | All |
| Roadmap problems | First ~70% of each topic | 100% |
| Run / Submit / hints | Yes | Yes |
| Solutions and editorials | — | Yes |
| Company lists: all-time | Yes | Yes |
| Company lists: 30/60/90 days + frequency | — | Yes |
| HR and SQL prep | Yes | Yes |
| Study plans | Free plans | All |
| Progress, notes, bookmarks, lists | Yes | Yes |

| Rooms (v1.1) | Starter ₹999/mo | Pro ₹2,999/mo | Colleges |
| --- | --- | --- | --- |
| Candidates / month | 25 | 100 | Custom |
| Interviewer seats | 2 | 5 | Custom |
| Hidden room-only pool | Yes | Yes | Yes |
| Reports and code playback | Yes | Yes | Yes |
| Plagiarism flag | — | Yes | Yes |
| Support | Email | Priority email | Dedicated contact |

Seat counts for Rooms are proposals; confirm before v1.1.

## 10. Non-functional requirements

| Area | Requirement |
| --- | --- |
| Performance | Landing/Learn LCP < 2.5 s on mid-range Android over 4G; Run/Submit result ≈ 5 s |
| Security | Code runs only in Judge0; hidden tests never reach the browser; Judge0 key only on the engine |
| Abuse | Per-user rate limits on Run/Submit (e.g. 30 runs / 5 min, 10 submits / min) |
| Data | Additive migrations; legacy tables archived; daily backups |
| Payments | Razorpay signature verification; entitlements from DB only |
| SEO | Landing, Learn and problem statements server-rendered; solutions not indexed |
| Accessibility | WCAG 2.1 AA contrast, keyboard navigation, prefers-reduced-motion |
| Reliability | Judge0 outage → clear message, user's code kept |
| UI quality | Every page passes the Impeccable gate in DESIGN.md §9 (detector clean, no high-severity `/audit` items) |
| Brand logos | Company and source logos only describe where a question was reported; no implied partnership; removal requests honoured |

## 11. Success metrics (first 60 days)

| Metric | Target |
| --- | --- |
| Activation: submit ≥1 problem within 24 h of signup | 40% |
| Week-1 retention | 25% |
| Complete first DSA layer | 15% |
| Free → Pro conversion | 2–3% |
| Lesson readers who click "Practice this" | 30% |
| Judge verdicts returned without error | 99% |
| Arena waitlist signups | Track only |

## 12. Timeline

| Week | Engineering | Content |
| --- | --- | --- |
| 1 | Audit + clean-up, design tokens, app shell | Templates, first 10 problems |
| 2 | Landing + pricing pages, content schema, Interview Prep migration, CSV import | 20 problems, 4 lessons, top-30 company list |
| 3 | Problems list, workspace + Monaco, engine service skeleton | 35 problems, 8 lessons |
| 4 | Judge0 Run/Submit end to end, Companies pages | 45 problems, 12 lessons |
| 5 | Roadmap page, Learn pages, study plans, My Prep | 55 problems, all DSA + pattern lessons |
| 6 | Razorpay Pro, Arena waitlist, Credits, QA, launch | 60 problems reviewed in 4 languages |
| 7–10 | v1.1 Rooms | Hidden room-only pool |

**Launch gate:** 60 problems pass in all 4 languages and Pro checkout works end to end.

## 13. Risks

| Risk | Mitigation |
| --- | --- |
| Content slower than code | Writers start week 1; launch with fewer problems rather than slip |
| Takedown over copied problem text | Originals only at launch; LeetCode/GFG as metadata-only rows; adapted statements later, in our own words |
| hello-algo NonCommercial licence | Ask author for written permission; links only until then |
| Judge0 cost / rate limits | Rate limits, queue, move to self-hosted Judge0 when volume grows |
| Breaking existing users | Archive tables, additive migrations, test on a staging copy |
| Room questions leaking (v1.1) | Hidden pool, per-room test variants, usage tracking |
| Resend look too close to Resend | Own cube asset, own copy and logo; match style, not assets |

## 14. Open questions

- [ ] Prices inclusive of 18% GST, or GST added at checkout?
- [ ] Rooms seat counts (2 / 5) — confirm
- [ ] Who writes and reviews content, and how many problems per week?
- [ ] Monthly budget for Judge0 and hosting
- [ ] Permission request sent to the hello-algo author?
- [ ] Final brand spelling: Algogym or AlgoGym; domain
