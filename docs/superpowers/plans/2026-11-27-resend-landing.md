# Resend-style Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make `/` match resend.com's look and motion: a live 3D cube hero, a moving company-logo marquee, a testimonial carousel and the same monochrome palette.

**Architecture:** A three.js scene (client-only, dynamically imported) replaces the cubes image. The marquee and carousel are CSS-animated client components fed by server data (catalog companies, testimonials file). Everything else stays in `apps/web/src/app/page.tsx`.

**Tech Stack:** Next.js 16, React 19, Tailwind 3, three@0.187.0 (pinned; published 2026-10-30), GSAP 3.15.1 (already installed).

**Spec:** owner messages of 2026-11-27 plus observations of resend.com (below). Skill: `.claude/skills/premium-landing`.

## Observed on resend.com (2026-11-27)
- Hero: a WebGL `<canvas>` (648 px wide) of a dark 3×3×3 rounded-cubelet cube, monochrome with a few glossy grey faces, lit from the top right, slowly rotating as its layers twist. A poster image is the fallback.
- Logos: white single-colour logos, 6 per row; heading text 18 px `#a1a4a5`, centred.
- Testimonials: an H2 and a subtitle, then a sideways row of cards (black, 1 px white/10 border, about 450 px wide, 16 px radius), each with the quote in `#a1a4a5`, then an avatar pair, name (white, 600) and role (grey).
- Palette: `#000` background, `#f0f0f0` text, `#a1a4a5` muted, white/10 borders, a faint purple glow on section icons. The final CTA is a large serif two-line statement.

## Global Constraints
- Original work only: no Resend text, logos, fonts, images or the cube asset. Build our own cube in three.js.
- **Testimonials must be real.** No made-up people or quotes on the live page (fake reviews mislead users and break consumer-protection rules). Entries live in `apps/web/src/content/testimonials.ts`; only `verified: true` entries render in production. Sample entries render only in development, marked "Sample".
- Avatars: cartoon SVG avatars generated locally from the name (no network, no photos).
- `prefers-reduced-motion`: a static cube frame, a paused marquee, no autoplay.
- 375 px and 1440 px with no horizontal page scroll; the AGENTS.md gates; `npx impeccable detect` on the live page.
- The three.js chunk loads only on `/`, after first paint (`next/dynamic`, `ssr: false`).

## Review Focus
- No WebGL (old phones, blocked GPU): the poster image must show, with no blank box.
- Hidden tab or scrolled offscreen: the render loop pauses (no CPU burn).
- Window resize: the canvas resizes without stretching.
- A company with no icon file: it must not render as a broken image in the marquee.
- An empty testimonials list in production: the section hides entirely.

---

### Task 1: three.js cube hero
**Files:** Create `apps/web/src/components/landing/cube-scene.tsx`. Modify `hero.tsx` (swap the `<Image>` for the dynamic scene, keep the poster as fallback). Modify `apps/web/package.json` (`three@0.187.0`, `@types/three@0.187.0`, exact versions).
- [x] 3×3×3 `RoundedBoxGeometry` cubelets (size 0.94, radius 0.08), `MeshPhysicalMaterial` near-black (`#0c0c0e`, metalness 0.5, roughness 0.38, clearcoat 0.6); 5 cubelets with a lighter grey (`#3a3a3e`, roughness 0.25).
- [x] Lights: `RoomEnvironment` through PMREM at intensity 0.35, a key directional light from the top right, a faint rim light from the back left.
- [x] Motion: the whole cube turns slowly on Y (and a little on X). Every 2.2 s a random layer twists 90° (attach to a pivot, ease `inOutCubic` over 0.9 s, re-attach, snap positions to the grid). The pointer tilts it through GSAP `quickTo`.
- [x] Pause when offscreen (IntersectionObserver) or the tab is hidden. With reduced motion, render one frame. `ResizeObserver` keeps the aspect ratio. Dispose everything on unmount.
- [x] Verify: a screenshot at 1440 and 375 shows the cube; with WebGL off, the poster shows.

### Task 2: Company logo marquee
**Files:** Create `apps/web/src/components/landing/logo-marquee.tsx`. Modify `page.tsx` (pass every catalog company that has an icon, up to 40) and `hero.tsx` (remove the static logo row).
- [x] Two rows moving in opposite directions (row 1 to the left, row 2 to the right), 40 s per loop. The list is duplicated so the loop is seamless, with mask-fade edges and pause on hover. Logos turn white (`brightness(0) invert(1)`) next to the name in white 600.
- [x] Heading: "Students and developers practise the problems asked at these companies", centred, 18 px `#a1a4a5`.
- [x] Verify: no horizontal page scroll at 375 px, and it stays still with reduced motion.

### Task 3: Testimonials carousel
**Files:** Create `apps/web/src/content/testimonials.ts` (`{ name; role; quote; verified: boolean }[]`), `apps/web/src/components/landing/testimonials.tsx` and `apps/web/src/components/landing/avatar.tsx` (`CartoonAvatar({ seed: string; size?: number })`, a deterministic SVG face).
- [x] Cards in Resend's shape. The row auto-scrolls slowly (paused on hover and with reduced motion) and can also be scrolled sideways.
- [x] `visibleTestimonials(list, env)` returns verified entries in production, and all entries in development (samples labelled). A unit test lives in `testimonials.spec.ts`.
- [x] The section is hidden when the list it receives is empty.

### Task 4: Palette, closing CTA and checks
- [x] Text `#f0f0f0` and muted `#a1a4a5` on the landing page; the final CTA becomes a large serif two-line statement with the glass button.
- [x] Run the gates (typecheck, lint, test, build, design:check, live Impeccable), screenshots at 375 and 1440, DECISIONS entry, commit and push `feat/landing`.
