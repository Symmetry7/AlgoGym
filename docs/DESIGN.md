# Algogym — Design System and Page Specs

**Version:** 1.0 · **Date:** 24 Nov 2026 · **Status:** Draft for review

Related docs: [PRD.md](./PRD.md) · [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)

---

## 1. Direction

**Marketing site:** Resend's polish with elenkus.in's layout: near-black, large serif statements, off-white paper cards, quiet grey text, sticky copy beside live product demos, and a three.js 3D roadmap in the hero (§3.1, §6.1). Algogym's twist: **emerald** for the main call to action.

**App:** TensorTonic's structure (roadmap path, split-pane workspace) and LeetCode's problem-list layout, in the same black + emerald system.

**Rule:** match Resend's *style and structure*, not its assets. Our own cube render, logo, illustrations and copy.

## 2. Tokens

### 2.1 Colour
| Token | Value | Use |
| --- | --- | --- |
| `--bg` | #000000 | Marketing page background |
| `--bg-app` | #050506 | App background |
| `--surface-1` | #0B0B0D | Cards, sidebars |
| `--surface-2` | #121214 | Raised cards, inputs |
| `--surface-3` | #1A1A1D | Hover, active rows |
| `--border` | rgba(255,255,255,0.08) | Hairlines, card borders |
| `--border-strong` | rgba(255,255,255,0.14) | Inputs, focused cards |
| `--text` | #F5F5F7 | Headings, body |
| `--text-muted` | #A1A1AA | Secondary text, nav links |
| `--text-faint` | #84848D | Captions, placeholders (≥ 4.5:1 on every surface; #71717A failed AA) |
| `--accent` | #22C55E | Primary buttons, highlights, selected node |
| `--accent-hover` | #16A34A | Button hover |
| `--accent-soft` | rgba(34,197,94,0.12) | Badges, glows, selected row tint |
| `--on-accent` | #04120A | Text on emerald (white on #22C55E fails contrast) |
| `--easy` / `--medium` / `--hard` | #22C55E / #F59E0B / #EF4444 | Difficulty |
| `--pro` | #EAB308 | Lock icons, Pro badges |

### 2.2 Typography
| Role | Font | Size / line-height | Weight |
| --- | --- | --- | --- |
| Display (hero, page titles) | Serif — **Instrument Serif** (free, Google Fonts) | 72–96 / 1.0 desktop, 44–52 mobile | 400 |
| H2 section titles | Instrument Serif | 48–56 / 1.05 | 400 |
| H3 / card titles | **Hanken Grotesk** (free, Google Fonts, OFL) | 20 / 1.3 | 600 |
| Body | Hanken Grotesk | 16 / 1.6 | 400 |
| Small / captions | Hanken Grotesk | 13–14 / 1.5 | 400–500 |
| Code | **Geist Mono** | 13–14 / 1.6 | 400 |

- UI font choice was checked with Impeccable's detector on live pages: Geist and Instrument Sans are both flagged as overused; Hanken Grotesk passes. Geist Mono (code only) passes. Re-run the detector before changing any family.

- Headings use solid `--text` (#F5F5F7). No gradient text anywhere.
- Never more than two font weights on one screen besides code.

### 2.3 Spacing, radius, depth
- 4/8 px grid; section padding 120 px desktop, 72 px mobile; max content width 1200 px; text blocks ≤ 640 px.
- Radius: buttons 10 px, cards 16 px, pills 999 px, inputs 10 px.
- Depth by borders, not shadows: 1 px `--border`, inner highlight `inset 0 1px 0 rgba(255,255,255,0.06)`.
- Glass card: `background: rgba(255,255,255,0.03); backdrop-filter: blur(12px); border: 1px solid var(--border)`.

### 2.4 Motion
- Durations: 150 ms (hover), 250 ms (panels), 600 ms (section reveal).
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)`.
- Only transform and opacity animate. `prefers-reduced-motion`: no reveals, cube shows poster image.

## 3. Signature visuals

### 3.1 3D roadmap scene (hero)
- A real-time **three.js** scene, replacing the pre-rendered glass cube (DECISIONS.md 2026-11-26): a short winding path of matte dark roadmap nodes. Done nodes have an emerald edge light, the current node pulses softly and locked nodes are dim. The camera drifts slowly, with a little parallax from the pointer.
- Loaded with a dynamic `import()` only on `/`, after first paint, and only when `IntersectionObserver` sees the hero. Budget ≤ 150 KB gzipped for three.js plus the scene. Pixel ratio capped at 1.5. The render loop pauses when the hero is offscreen or the tab is hidden.
- A static `roadmap-poster.webp` (rendered from the same scene) shows instead below 768 px, with `prefers-reduced-motion`, with Save-Data, without WebGL, and until the scene is ready. No layout shift: the poster and the canvas share one box.
- The node meshes and lighting are reused by the M13 roadmap page, so the 3D look stays the same everywhere.

### 3.2 Light beam background
Two large blurred radial gradients (white at 4–6% opacity) angled across the hero, plus a faint noise texture (2% opacity) to avoid banding.

### 3.3 Roadmap 3D icons
- Isometric, matte dark with emerald edge light, same camera angle and lighting for every topic; 256×256 WebP, transparent background.
- One per topic: Arrays (stacked cubes), Hashing (grid with keys), Two Pointers (two pillars), Sliding Window (frame on a bar), Binary Search (split block), Stack (stacked plates), Linked List (chained nodes), Trees (branching blocks), Graphs (connected nodes), DP (grid table), Heaps (pyramid), Tries (branching letters), Union-Find (merged sets).

## 4. Icons

Three sources, each with one job. Never mix styles inside one component, never hand-draw a brand logo, never use emoji as icons.

| Need | Source | Licence | Examples |
| --- | --- | --- | --- |
| Languages and technologies | [Devicon](https://github.com/devicons/devicon) (`devicon` npm) | MIT; logos remain their owners' trademarks | JavaScript, Python, C++, Java, PostgreSQL/MySQL (SQL track), React, Node.js, Docker, Git |
| Brands: companies and problem sources | [Simple Icons](https://simpleicons.org) (`simple-icons` npm) | CC0 icon data; logos remain their owners' trademarks — read their DISCLAIMER.md | Google, Meta, Uber, Flipkart, LeetCode, GeeksforGeeks |
| UI glyphs | [Lucide](https://lucide.dev) (`lucide-react`) | ISC | search, filter, lock, check, chevrons, play, send |

### 4.1 Rules
- **Self-host, don't hot-link.** Import SVGs at build time from the pinned npm packages (no `cdn.jsdelivr.net` or `cdn.simpleicons.org` at runtime, no Devicon icon font CSS). A script (`scripts/build-icons.ts`) copies only the icons we use into `public/icons/{devicon,brands}/` and writes a typed map (`iconMap.ts`).
- **Monochrome by default.** Render as inline SVG with `fill="currentColor"`: `--text-muted` in lists, the trust strip and chips; `--text` on hover. Brand colour only in two places: the language selector in the workspace (Devicon "colored" variant) and the company page header.
- **Variants.** Devicon: `plain` for UI (single colour), `original` only where full colour is wanted; never the `wordmark` variants inside chips. Simple Icons: icon only; the company name is always written next to it in Hanken Grotesk.
- **Sizes.** 16 px in chips and rows, 20 px in tabs and selectors, 32 px in company cards, 24 px height for trust-strip wordmark row (icon + name).
- **Missing brands.** Some companies aren't in Simple Icons (their owners asked for removal). Use a neutral monogram tile: 1–2 letters in Hanken Grotesk 600 on `--surface-2`, same size and radius. Never recreate the logo.
- **Trademark use.** Logos only describe where a question was reported ("Asked at Google"), never imply partnership. Honour any removal request; keep the Credits page listing Devicon, Simple Icons and Lucide.
- **Roadmap topic icons** are our own isometric renders (section 3.3), not icon-set glyphs.

## 5. Components

| Component | Spec |
| --- | --- |
| Primary button | Emerald bg, `--on-accent` text, 10 px radius, 44 px tall, 600 weight; hover `--accent-hover`; focus ring 2 px emerald + 2 px offset |
| Secondary button | Transparent, 1 px `--border-strong`, `--text`; hover `--surface-2` |
| Ghost link | `--text-muted` → `--text` on hover, arrow ›/→ shifts 2 px |
| Pill badge (hero) | Glass, 1 px border with a faint emerald→white gradient, 13 px text + › |
| Nav | 64 px, transparent over hero, blurred `rgba(0,0,0,0.6)` after scroll; links `--text-muted`; Get started = primary button (small) |
| Tabs (segmented) | Pill container `--surface-2`; active tab `--surface-3` + `--text`; used for pricing toggle, Learn tracks |
| Card | `--surface-1`, 1 px border, 16 px radius, 24 px padding |
| Difficulty chip | Text only in difficulty colour, 13 px, 500 |
| Source badge | 16 px Simple Icons glyph (LeetCode, GeeksforGeeks) or the Algogym mark + number ("LC 1", "GFG 214", "AG 12"), monochrome, `--surface-2` pill |
| Company chip | 16 px Simple Icons logo (or monogram tile) + name, monochrome, `--surface-2` pill; "+N" overflow |
| Language selector | 20 px Devicon colored icon + name (JavaScript, Python, C++, Java) |
| Lock | `--pro` lock icon; locked rows keep full opacity text, lock at the end |
| Frequency bar | 5 small bars filled in emerald; blurred + lock for Free |
| Progress ring | 2 px stroke, emerald arc on `--surface-3` track |
| Segmented progress bar | One segment per problem: solved = emerald, rest `--surface-3` |
| Code block | `--surface-1`, Geist Mono, line numbers `--text-faint`, copy button top-right |
| Table (pricing compare) | No outer border, row hairlines, sticky tier header, ✓ in emerald, – in `--text-faint` |
| Toasts | Sonner, dark, bottom-right |

## 6. Page specs

### 6.1 Landing (/): elenkus layout, Algogym brand
Decided 2026-11-26 (DECISIONS.md). The structure follows elenkus.in: a serif statement and an off-white "paper" card up top, then sticky copy on the left beside **live product demos** on the right, built from the real app components. Resend's polish bar (§6 intro) still applies. The brand stays ours: Instrument Serif for statements, Hanken Grotesk for UI, near-black surfaces, and emerald **only** on the main CTA. No text, images or code from elenkus or Resend. Copy is original, in Indian English, written with the `design:ux-copy` skill, and every number is real and cited.

1. **Nav**: logo on the left; Features ▾ · Companies · Pricing · Arena (Soon) in the centre; Log in and Get started on the right. On mobile, logo plus a menu sheet.
2. **Hero**:
   - A large serif statement (72–96 px desktop, 44–52 px mobile), e.g. "Walk into your interview ready."
   - Under it, a full-width **paper card** (`#F1F0EA` background, `#0B0B0D` text, 24 px radius) with a serif line, one sentence of subtext, and **Get started** (emerald) plus "Explore the roadmap" (ghost, dark).
   - Beside or behind the card, the **3D roadmap scene** (§3.1).
3. **How it works**: one row per step. Copy sticks on the left (H3 in Hanken Grotesk 600 and ≤ 3 lines of body) while the demo card on the right scrolls past. Each demo is interactive and uses real components with sample data:
   1. *Pick your target*: company, role, weeks left and hours a day, which turns into a weekly plan.
   2. *Tick off what you already know*: a topic checklist. Unticked topics become lessons placed before you need them.
   3. *Your roadmap is a path you unlock*: a mini roadmap of nodes with done, current and locked states and connector lines.
   4. *Solve it in your browser*: a mini flux-style editor (§6.6) where Run streams "Case 1 · Accepted · 12 ms" lines.
   5. *Stuck? One hint at a time*: hints that open in order, with the last one stopping short of the code.
4. **Statement card**: a paper card with a serif H2 (e.g. "Solving isn't the same as remembering") and one line of evidence. The sticky rows that follow cite real learning-science findings (retrieval practice, spacing, worked examples), each with its source. No invented statistics; leave a claim out rather than guess.
5. **Feature grid**: 2 columns on desktop, 1 on mobile. Each card has a small monochrome illustration panel (`--surface-2`, 16 px radius) on top, a serif title and 2 lines of copy. Cards: Roadmaps, Company prep, Hidden tests in 4 languages, Study plans, My Prep, Rooms for interviewers (Soon).
6. **Practice by company**: 8 company cards from the M7 metadata (logo, problem count, top 2 patterns), then "See all companies ›".
7. **Pricing teaser**: Free and Pro side by side, plus "See pricing ›".
8. **Final CTA**: a paper card with "Start preparing today" and Get started, then the footer in 4 columns (Product, Learn, Company, Legal incl. Credits).

- **Motion:** sticky rows fade and rise in once (600 ms, §2.4), and demos animate only while visible. With `prefers-reduced-motion`, everything is static, demos show their end state and the 3D scene shows its poster.
- **Mobile (< 768 px):** every sticky row stacks as copy then demo, with no sticky behaviour. Demos stay tappable at 375 px with no horizontal scroll. Paper cards use 16 px padding and an 18 px radius.
- **Done means:** Impeccable gate (§9), Lighthouse ≥ 90 on mobile performance and accessibility, and checks at 375, 768, 1024 and 1440 px.

### 6.2 Pricing (/pricing) — Resend layout
- Serif "Pricing" centred, subtext "Learn free. Upgrade when you're ready."
- Segmented toggle: **For learners** | **For interviewers & colleges**; Monthly/Yearly switch with "Save 37%" on yearly (₹1,499 vs ₹2,388).
- Tier cards in a row, equal height, 1 px border, 16 px radius: name (small, centred) → big price ("₹199 / mo") → hairline → one-line quota → hairline → ✓ list → button at the bottom. Recommended tier gets an emerald border.
  - Learners: Free ₹0 · Pro ₹199/mo (₹1,499/yr).
  - Interviewers: Rooms Starter ₹999/mo · Rooms Pro ₹2,999/mo · Colleges "Custom" + Contact us. Until v1.1: "Launching soon" ribbon + Join waitlist buttons.
- Comparison tables by category: Learning · Practice · Company prep · Rooms · Support.
- FAQ accordion, then trust strip.

### 6.3 Roadmap (/roadmap/[track])
- App shell (top nav + left icon rail). Main area split 60/40.
- Left: track switcher + Essentials/Complete toggle on top; vertical winding dotted path (1 px dashed `--text-faint`) with 3D icons; layer labels on the left edge in small caps `--text-faint` ("LAYER 1 · FOUNDATIONS"); node pill = glass, name + "0 / 17"; selected node = emerald glow ring + `--accent-soft` floor ellipse.
- Right sticky panel (card): layer + "02 / 13", title (20/600), "7 problems · 0 solved", segmented bar, **Learn** (primary) + **Practice** (secondary), "What's inside" list rows (status circle, title, source badge, difficulty, lock).
- Mobile: path full-width; tapping a node opens the panel as a bottom sheet.

### 6.4 Learn lesson (/roadmap/[track]/[topic])
- Left rail 240 px: layer name, topic list with states, progress.
- Content column 720 px: serif H1, reading time, sections with H2 in Hanken Grotesk 600; diagrams and step-through visual in glass panels; code tabs (JS/Python/C++/Java); complexity table; "Common mistakes" callout; quiz card; "Practice this" list.
- Right "On this page" TOC (desktop only).

### 6.5 Problems (/problems) — LeetCode layout, Algogym look
- 3 columns: left sidebar 240 px · main · right sidebar 320 px.
- Main: banner strip (3 glass cards) → tag row with counts → category pills → toolbar (search, sort, filter, solved ring, shuffle) → rows 56 px, alternate `--surface-1` / transparent, hover `--surface-3`.
- Right: daily calendar card (today = emerald filled circle, solved days = emerald dot), trending companies card, progress card.
- Mobile: single column; sidebars become drawers from the top bar.

### 6.6 Workspace (/problems/[slug]): floating panels
Modelled on the flux.rq3.workers.dev editor (2026-11-26, DECISIONS.md). The page is `--bg-app` with floating cards on it, never edge-to-edge panes.

- **Panels:** 12 px gap around and between every panel and the top bar. Each panel is a `--surface-1` card with a 1 px `--border` and 16 px radius, and scrolls inside itself. The 12 px gaps double as drag handles for resizing (hairline `--border-strong` on hover, `col-resize`/`row-resize` cursor, arrow keys when focused). Each panel can collapse.
- **Top bar:** one floating rounded bar (16 px radius, 48 px tall), in this order:
  - Back (to the problems list), then the breadcrumb: the problem title in Hanken Grotesk `--text` and the id in Geist Mono `--text-faint` (e.g. "Quiet Hours  AG 12"). Prev/next go in the back menu, not as extra buttons.
  - On the right, the language picker shows the name plus a muted version ("Python 3.12", version in `--text-faint`). Versions come from the judge's language config, not hard-coded.
  - **Run** is a light off-white pill (`--text` background, `--bg` text) with a black circular play icon.
  - **Submit** is the emerald primary button.
  - Shortcuts: Ctrl+Enter runs and Ctrl+Shift+Enter submits (⌘ on macOS). Both buttons show the shortcut in their tooltip.
- **Layout by width:**
  - ≥ 1280 px: three columns, Problem | Editor | Output · Input · Tests (default 34 / 41 / 25 %).
  - 768–1279 px: two columns, Problem | Editor, with Output · Input · Tests docked under the editor at 35 % height.
  - < 768 px: one panel with tabs "Problem · Code · Result". Run and Submit stay in the top bar.
- **Problem panel:**
  - Tabs with small Lucide icons (16 px, `--text-muted`, the active tab `--text` on `--surface-3`).
  - Statement typography is 15/1.65, examples sit in `--surface-2` blocks, and hints are accordions.
  - Locked state: the statement blurs after its first paragraph, with an upgrade card.
- **Editor panel:**
  - The header shows the file name in muted Geist Mono (`solution.py`, `solution.js`, `solution.cpp`, `Solution.java`).
  - Monaco runs with a custom theme: background `--surface-1`, line numbers `--text-faint`, a subtle current-line highlight (`rgba(255,255,255,0.03)`), selection `rgba(255,255,255,0.10)` and cursor `--text`.
  - No minimap. Geist Mono 13–14 px.
- **Output · Input · Tests panel:** tabs with small Lucide icons (Terminal, TextCursorInput, ListChecks).
  - A passed case shows an emerald dot and "Accepted". A failed case shows a `--hard` dot and the verdict in words.
  - Every state has a text label; colour never carries the meaning alone.
- **Empty states say what to do:**
  - Output: "Run your code to see output. Ctrl+Enter works too."
  - Tests: "Submit to check every hidden test. Ctrl+Shift+Enter works too."
  - Input: "Edit an example below to try your own input."
- **Colour:** the UI is monochrome. Emerald appears only on Submit, passed cases and focus rings.
- **Not in practice mode:** presence avatars and a Share button in the top bar belong to Rooms (v1.1, M21+).

### 6.7 Companies, My Prep, Study plans
- Companies grid: 4 columns of cards (logo 32 px, name, "214 problems", top patterns chips).
- Company page: header with logo + counts, tabs (All time · 30 · 60 · 90 days, the last three with lock for Free), problem table with frequency bars.
- My Prep: 12-column grid; continue card (full width), progress per track (rings), streak heatmap (emerald scale), recent solves, bookmarks, lists.
- Study plans: card grid like TensorTonic (title, one line, count, tags).

### 6.8 Arena (/arena)
Full-height dark page, serif "Arena", short explainer with a looping preview of two editors racing, "Notify me" button, "Soon" badge.

## 7. Accessibility
- WCAG 2.1 AA: body text ≥ 4.5:1 (`--text-muted` on black passes), emerald buttons use `--on-accent` dark text.
- Keyboard: every control reachable; visible focus ring; Esc closes drawers/sheets; Monaco shortcuts listed in settings.
- Icons with labels or `aria-label`; difficulty never shown by colour alone (text label always present).
- `prefers-reduced-motion` respected everywhere.

## 8. Responsive breakpoints
| Name | Width | Notes |
| --- | --- | --- |
| sm | 375–639 | Single column, drawers, bottom sheets, hero headline 44 px |
| md | 640–1023 | Two columns where useful, cube below the headline |
| lg | 1024–1279 | Full layouts, right sidebars collapse first |
| xl | ≥ 1280 | Full three-column problems page |

## 9. Quality gate: Impeccable

Every UI change goes through [Impeccable](https://impeccable.style) (Paul Bakaus's design skill for Claude Code) to strip "AI slop" before it ships.

**Setup (once):** install the Impeccable bundle for Claude Code from impeccable.style, then run its `teach` step so it learns this file (tokens, fonts, emerald accent, Resend direction) as the project's design context.

**Per milestone, in Claude Code:**
1. Build the page against this file.
2. `/critique` the page — fix what it finds.
3. `/audit` — accessibility, responsiveness, performance, anti-patterns.
4. `/polish` — spacing, alignment, states, copy details.
5. Use `/distill` if a screen feels busy, `/quieter` if it shouts, `/bolder` if it's bland.
6. Run `npx impeccable detect src/` (also in CI); the PR can't merge with new findings unless the exception is written in the PR description.

**Done means:** detector clean, `/audit` has no high-severity items, and the page has been looked at on a 375 px phone and a 1440 px desktop.

## 10. Do / Don't

**Do**
- Lots of black space; one emerald action per view.
- Serif only for big headings; Hanken Grotesk for everything else; Geist Mono for code.
- Borders over shadows; one radius scale.
- Real data and real copy in every mock-up (actual problem names, actual counts).
- Icons only from Devicon, Simple Icons and Lucide, monochrome by default.

**Don't (AI-slop tells)**
- Gradient text, purple/blue or rainbow gradients, gradient buttons, glowing borders everywhere.
- Glassmorphism on every card — glass is reserved for the hero badge, bento cards and preview frames.
- Cards nested inside cards; three identical feature cards with an emoji each.
- Default fonts (Inter, Roboto, Arial, system-ui), or any family beyond Instrument Serif, Hanken Grotesk and Geist Mono.
- Emoji as icons, mixed icon styles, hand-drawn brand logos.
- Vague copy ("Unlock your potential", "Supercharge your prep", "Seamless"); every heading says something specific.
- Fake testimonials, fake user counts, fake company endorsements.
- Coins, badges, confetti, streak-loss guilt prompts.
- Resend's own assets, logo or copy.
