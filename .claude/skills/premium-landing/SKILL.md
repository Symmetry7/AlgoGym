---
name: premium-landing
description: Build or restyle Algogym's marketing pages (landing, pricing) at a premium level with the speckled-graphite look, GSAP motion and the approved component sources (GSAP, anime.js, Kokonut UI, Watermelon UI, generative-loaders). Use when working on the landing page, hero, marketing sections or their animation.
---

# Premium landing (Algogym)

## Look: speckled graphite
- Surfaces are graphite, not pure black: `--ag-graphite-0` (page) to `--ag-graphite-2` (raised cards), defined in `apps/web/src/styles/tokens.css`.
- The speckle is the `.ag-speckle` utility (tokens.css): an SVG `feTurbulence` grain plus sparse light flecks, layered over a soft radial highlight. Use it on the page background and hero only, never behind body text smaller than 15 px.
- Cards: 1 px `--ag-border` hairline, a top inner highlight (`--ag-inset-highlight`), 16–20 px radius, `graphite-1` fill. No drop shadows on dark.
- Type: Instrument Serif for display lines, the UI font for everything else, Geist Mono for code. Emerald (`--ag-accent`) only on the main CTA and success states.
- Layout reference: TensorTonic's hero, which has the headline and CTA on the left, language tags, and a live code-editor mock on the right that runs and ticks off checks. Use the structure only, never its copy or assets.

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
