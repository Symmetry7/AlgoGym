---
name: premium-landing
description: Build or restyle Algogym's marketing pages (landing, pricing) at a premium, Resend-like level with GSAP motion and the approved component sources (GSAP, anime.js, Kokonut UI, Watermelon UI, generative-loaders). Use when working on the landing page, hero, marketing sections or their animation.
---

# Premium landing (Algogym)

## Look: Resend-style black (owner decision, 2026-11-27)
- Reference: resend.com. Match its structure, rhythm and restraint only. Never use its text, logo, fonts, illustrations or the cube render.
- Page: pure black (`--ag-bg`). The hero has a soft spotlight from the top right (radial white at 13%) and one faint diagonal light streak (blurred, rotated about -7°). Nothing else decorates the background: no grain, no speckle, no graphite.
- Headlines: solid `#f0f0f0` (no gradient text: the Impeccable gate rejects `background-clip: text`). Hero: bold UI sans, PracHub-style, with one emerald key word and a drawn underline. Section H2s: Instrument Serif 56 / 40 px.
- Body: 18 px, `#a1a4a5`, line-height 1.5, at most 2–3 lines in the hero.
- Buttons: `.ag-glass-button`, a dark translucent gradient with a 1 px white/14 border and an inner top highlight, 48 px tall with a 16 px radius. The secondary button is plain grey text that turns white on hover.
- Badge: a pill with a white/15 border and a chevron, linking somewhere real.
- 3D object on the right: our own `/hero/algogym-cubes-poster.webp`, desaturated, floating slowly and tilting towards the pointer (GSAP `quickTo`).
- Logo row: centred, grayscale, about 60% opacity until hover.
- Cards: black or `--ag-surface-1`, a hairline white/10 border, 20–24 px radius, optionally a soft top radial light. No drop shadows on black.
- Keep it simple: no code editors or busy demos in the hero.

## Motion: GSAP (installed: `gsap@3.15.1`, `@gsap/react@2.1.2`)
```tsx
"use client";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
gsap.registerPlugin(useGSAP, ScrambleTextPlugin);

useGSAP(() => {
  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    gsap.from("[data-hero-line]", { y: 24, opacity: 0, stagger: 0.08, duration: 0.8, ease: "expo.out" });
  });
}, { scope: rootRef });
```
- Always scope `useGSAP` to a ref, and wrap animations in `gsap.matchMedia()` with `prefers-reduced-motion: no-preference`. The reduced-motion state is the final, static frame.
- Animate only `transform`, `opacity` and SVG attributes. Pause timelines that are offscreen (IntersectionObserver, or `ScrollTrigger` `toggleActions`).
- Plugins available free: ScrollTrigger, SplitText, ScrambleText (decode text), MotionPath, DrawSVG, Flip.

## Other approved sources (add only when a section needs them)
- **anime.js** (`animejs`, MIT): an alternative engine. Don't add it next to GSAP on the same page, because one engine per page keeps the bundle small.
- **Kokonut UI** (MIT, shadcn registry): `npx shadcn@latest add kokonut-labs/kokonutui/<name>`. Backgrounds (Halftone, Topo, Caustics), text effects and buttons. Its components need `motion`. Read the added file before committing it and swap colours for `--ag-` tokens.
- **Watermelon UI** (MIT, shadcn registry): `npx shadcn@latest add https://registry.watermelon.sh/r/<name>.json`. Same review rule.
- **generative-loaders** (MIT, npm): AI-style text and image loaders. It pulls in framer-motion, so use it only for an AI-answer demo; for a one-off decode effect, prefer GSAP ScrambleText.

## Done means
Check the page at 375 and 1440 px (no horizontal scroll), with reduced motion on, run the AGENTS.md gates, and run `npx impeccable detect` against the running page.
