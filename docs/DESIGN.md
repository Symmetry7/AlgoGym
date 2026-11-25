# Algogym — Design System and Page Specs

**Version:** 1.0 · **Date:** 24 Nov 2026 · **Status:** Draft for review

Related docs: [PRD.md](./PRD.md) · [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)

---

## 1. Direction

**Marketing site:** Resend's look — pure black, soft light beams, large serif headlines, quiet grey text, frosted-glass product shots, a 3D glass cube in the hero. Algogym's twist: **emerald** for buttons and highlights.

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
| H3 / card titles | **Geist** (free, by Vercel) | 20 / 1.3 | 600 |
| Body | Geist | 16 / 1.6 | 400 |
| Small / captions | Geist | 13–14 / 1.5 | 400–500 |
| Code | **Geist Mono** | 13–14 / 1.6 | 400 |

- Not Inter, Roboto or system-ui: Impeccable's slop detector flags default fonts, and Geist pairs cleanly with the serif display face.

- Hero and section titles use a subtle top-to-bottom gradient: #FFFFFF → #A1A1AA (Resend-style).
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

### 3.1 Glass cube (hero)
- Pre-rendered loop, made in Spline or Blender: frosted glass cube with soft refraction, a faint emerald core glow, slow 8 s rotation on a black background, light beam from the top-left.
- Exports: `cube.webm` (VP9) + `cube.mp4` (H.264) + `cube-poster.webp`; 1080×1080; ≤ 1.5 MB per video; seamless loop.
- `<video autoplay muted loop playsinline preload="metadata" poster=…>`; lazy on mobile; poster only when reduced motion or Save-Data.

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
- **Variants.** Devicon: `plain` for UI (single colour), `original` only where full colour is wanted; never the `wordmark` variants inside chips. Simple Icons: icon only; the company name is always written next to it in Geist.
- **Sizes.** 16 px in chips and rows, 20 px in tabs and selectors, 32 px in company cards, 24 px height for trust-strip wordmark row (icon + name).
- **Missing brands.** Some companies aren't in Simple Icons (their owners asked for removal). Use a neutral monogram tile: 1–2 letters in Geist 600 on `--surface-2`, same size and radius. Never recreate the logo.
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

### 6.1 Landing (/) — Resend layout
1. **Nav** — logo left; Features ▾ · Companies · Pricing · Arena (Soon) centre; Log in + Get started right.
2. **Hero** (100 vh, left-aligned at 1200 px container):
   - Pill badge: "New: Company prep 2026 ›"
   - Serif headline, two lines, e.g. "Interview prep / for developers"
   - Subtext (≤ 2 lines): "Learn every topic free, practise real interview questions in your browser, and walk in ready."
   - Buttons: **Get started** (emerald) + "Explore roadmap" (ghost)
   - Glass cube loop on the right half, light beam across the section
3. **Trust strip** — "Practice questions reported from interviews at" + greyscale company wordmarks in two rows.
4. **Learn** — serif H2 "Learn", one-line subtext, segmented tabs (DSA · Patterns · SQL · HR · System Design *Soon*), below a glass panel showing a lesson preview with an animated step-through visual.
5. **A real coding workspace** — bento of 2 large + 2 small glass cards: workspace (Run streams "Case 1 ✓ 12 ms" lines like Resend's request log), roadmap path card, hints card, companies card. Each card: icon, title, one line, "Learn more ›".
6. **Roadmaps** — full-width preview of the winding path with 3D nodes + right topic panel.
7. **Practice by company** — 8 company cards (logo, problem count, top 2 patterns), "See all companies ›".
8. **Feature grid** — 3×3, each: small icon + title + 2-line description.
9. **Testimonial** — single large quote with company logo (only real, permission-backed quotes; hide section until then).
10. **My Prep** — tabs (Progress · Streak · Companies) with dashboard screenshot in a glass frame.
11. **Arena teaser** — "1v1 duels are coming", Join waitlist.
12. **Final CTA** — serif "Start preparing today" + Get started; footer in 4 columns (Product, Learn, Company, Legal incl. Credits).

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
- Content column 720 px: serif H1, reading time, sections with H2 in Geist 600; diagrams and step-through visual in glass panels; code tabs (JS/Python/C++/Java); complexity table; "Common mistakes" callout; quiz card; "Practice this" list.
- Right "On this page" TOC (desktop only).

### 6.5 Problems (/problems) — LeetCode layout, Algogym look
- 3 columns: left sidebar 240 px · main · right sidebar 320 px.
- Main: banner strip (3 glass cards) → tag row with counts → category pills → toolbar (search, sort, filter, solved ring, shuffle) → rows 56 px, alternate `--surface-1` / transparent, hover `--surface-3`.
- Right: daily calendar card (today = emerald filled circle, solved days = emerald dot), trending companies card, progress card.
- Mobile: single column; sidebars become drawers from the top bar.

### 6.6 Workspace (/problems/[slug])
- Top bar 48 px: logo, list drawer, prev/next, breadcrumb, source badge + "View original ↗", Run (secondary) and Submit (primary) on the right.
- Split pane 45/55, draggable gutter, each side collapsible.
- Left: tabs with icons; statement typography 15/1.65; examples in `--surface-2` blocks; hints as accordions; interactive visual in a glass panel with a slider.
- Right: Monaco with a custom dark theme matching tokens (background `--surface-1`, selection `--accent-soft`, cursor emerald); bottom panel 35% height with Testcase / Test Result tabs; passed case chips = emerald dot, failed = red dot.
- Locked state: blurred statement after the first paragraph + upgrade card.
- Mobile: tabs "Problem · Code · Result".

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
- Serif only for big headings; Geist for everything else.
- Borders over shadows; one radius scale.
- Real data and real copy in every mock-up (actual problem names, actual counts).
- Icons only from Devicon, Simple Icons and Lucide, monochrome by default.

**Don't (AI-slop tells)**
- Purple/blue or rainbow gradients, gradient buttons, glowing borders everywhere.
- Glassmorphism on every card — glass is reserved for the hero badge, bento cards and preview frames.
- Cards nested inside cards; three identical feature cards with an emoji each.
- Default fonts (Inter, Roboto, Arial, system-ui), or any family beyond Instrument Serif, Geist and Geist Mono.
- Emoji as icons, mixed icon styles, hand-drawn brand logos.
- Vague copy ("Unlock your potential", "Supercharge your prep", "Seamless"); every heading says something specific.
- Fake testimonials, fake user counts, fake company endorsements.
- Coins, badges, confetti, streak-loss guilt prompts.
- Resend's own assets, logo or copy.
