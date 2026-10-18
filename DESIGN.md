# AlgoGym design system

## Latest landing refinement

Latest typography correction supersedes the earlier headline below: locally served IBM Plex Sans variable font (license alongside the font in `public/fonts/ibm-plex-sans`), natural wrapping, medium-weight headings, and readable 14–17px body copy. Hero: “Your competitive programming workspace.” Feature titles use direct product names. The large brand treatment now uses the user's original `AlgoGymLogo` image instead of typed letters; its width is capped at 440px and 70% of the section, centered above the level training panel with 24–32px clear separation. Do not redraw the wordmark or inflate it to the viewport width.

Landing copy now describes concrete tasks rather than motivational slogans: the hero reads “Practice for your next contest.” Feature headings name coding profiles, Chakra, analytics, and college discovery. Below the hero, IntersectionObserver triggers one-time card/row reveals, a brief border glint, and staggered decorative bars. Hover and keyboard focus move illustration details. Content remains visible without animation initialization; live reduced-motion changes disable these effects. No animation package or continuous flicker is used. `scripts/check-landing-reveals.mjs` covers reveal triggering, one-shot playback, bars, reduced motion, visible keyboard focus, and runtime errors.

The hero now fills the viewport edge to edge, with enlarged Blender cubes and a separately stacked phone layout. Small phones may scroll to preserve readable content rather than shrink controls. The animated scene retains pause, visibility throttling, reduced-motion and WebGL fallback behavior.

`heh3.mp4` (17.65 seconds) informs the sections below it: large editorial statement, staggered charcoal cards, oversized wordmark with an overlapping practice surface, illustrated destination rows, and a circular closing invitation. These are product illustrations, not fabricated user statistics. Each linked card opens the existing application flow. Marketing remains dark in either application theme. The landing stylesheet was consolidated to remove superseded designs.

## Sources

Functional hierarchy: supplied 3:38 recording. The latest visual references supersede the earlier dashboard mockup: `heh.mp4` (4.95 seconds) and the October 17 dashboard screenshot inform charcoal panels and compact data layouts; `heh2.mp4` (8.97 seconds) defines the rounded cinematic hero and floating metallic cube motion. Entire short recordings were inspected at one-second intervals, with full-resolution frames. Branding is the supplied white/purple wordmark at `public/brand/algogym-wordmark.png`, rendered through `AlgoGymLogo`. Do not reuse Codolio's mascot, assets or proprietary score.

## Tokens and components

- Neutral charcoal background/surfaces (`--background: 0 0% 5%`, `--card: 0 0% 10%`), fine neutral borders, warm near-white text, muted gray, and lilac Chakra accent. Select dashboard metric surfaces use pale stone or lilac with dark text. Semantic theme variables remain the source of truth.
- Reuse existing Tailwind semantic variables, Radix/shadcn inputs/dialogs/menus/tabs, Lucide icons and existing typography. Support theme tokens across application surfaces; light mode must retain contrast.
- Body 14px, secondary 12px, labels 11–12px, section headings 16–20px, page heading 28–32px. Landing has the expressly requested larger hero.
- Spacing scale 4/8/12/16/24/32; 36–44px controls. Dashboard/analytics panels use 18–20px radii and compact controls, reflecting the latest supplied inspiration; dense evidence stays in tables. One main action per stage.
- Responsive sidebar: labeled desktop navigation and accessible mobile sheet. Profile is identity column + analytics grid, stacked on mobile. Workspace/notes use master-detail with a mobile back action.
- Charts use restrained colors, visible axes, tooltips and accessible data. Reserve green for confirmed success, amber for pending/stale and rose for errors. Never turn unknown data into zero.

## Interaction contracts

Keyboard focus is visible; fields have labels; feedback uses status/alert regions. Mutations disable only affected actions. Dialogs trap focus and restore focus. Sync shows timestamps/retry and keeps saved evidence. Personal completion and verified solves have distinct wording. Only show export, search, filter, subscribe, follow and share controls when their corresponding operation exists.

The hero uses an original Blender mesh and still, with six individually rotating metallic cubes rendered through lazy-loaded Three.js. This expressly requested cinematic motion is limited to the hero, includes a pause control, stops rendering offscreen or in a hidden tab, and uses the still without animation for reduced-motion users or WebGL failures. Cube artwork carries no account metrics. Application values always come from actual records.

## Connection and organization panels
Use the supplied wallet-connector references for compact provider rows, recognizable platform marks, a searchable left rail and one verification form on the right. Mobile stacks the provider grid above the form. Keep charcoal surfaces opaque, focus rings visible and success feedback tied to server verification. The society creation panel pairs a short explanation with a name-first form; optional college and description stay secondary. Invitations use one copy action and a high-contrast locally generated QR code.
