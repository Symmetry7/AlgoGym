# AlgoGym 3.0 design direction

Status: implementation brief, 2026-10-21. The official Symm AI mark and references were inspected from the user-supplied local files. This file defines visual direction; it does not assert that every 3.0 feature is shipped.

## Product hierarchy

Symm AI is the primary learning entry point: ask a question, choose C++17/Java 17/Python 3, receive a roadmap, study a lesson, use a contextual tutor, then move into verified practice. Training Gym is the structured practice companion. Coins/Chakra reflect verified competitive achievements; AI credits measure generation allowance and must never be mixed with the reward ledger.

## Reference extraction

| Reference | Observed design principle | AlgoGym adaptation |
| --- | --- | --- |
| `typography-symm-ai.webp` | Helvetica Neue regular/medium/semibold; ink `#060B0A`, white `#FFFFFF`, gray `#969F9A`, mint `#22FFA6`, cyan `#1DE7E0`. | Use a Helvetica Neue/system sans stack and ink surfaces in Symm AI. Mint/cyan are small focus and progress accents, never large glows. Existing AlgoGym lavender remains in the broader app until the token audit is complete. |
| `symm-ai(2.0).webp` | Narrow sidebar, calm black canvas, one dominant composer, restrained rows. | Navigation for paths and library, without copying unrelated AI chat, image, or API-key controls. |
| `symm ai logo.webp` | Five white geometric blades around a black pinwheel center on a black square. | Preserve the supplied raster geometry as the official mark. Produce asset variants only by cropping/scaling; do not redraw an approximate sparkle. |
| `ui design.jpg` | Three aligned dark pricing cards, centered price hierarchy, restrained brighter middle plan. | Free/Pro/Premium comparison with Pro emphasized; avoid announcing checkout while no merchant account exists. |
| Landing reference video (37.44 s screen recording) | Its embedded motion piece uses black fields, rapid kinetic typography, blue/cyan light, grid overlays, and product-frame cuts. | Use short authored typography and authentic AlgoGym captures; the reference is a recording of another video, not usable product footage. |
| Supabase sidebar recording (13.5 s) | Compact icon rail expands to grouped text navigation; quiet active pill and a stable top header. | Persistent, accessible AlgoGym navigation with Symm AI prominence and mobile drawer. Do not reproduce Supabase's dashboard content. |

Research: [USACO Guide](https://usaco.guide/) demonstrates progressive tiers, curated resources, problems, and progress states; [YouKn0wWho Academy](https://youkn0wwho.academy/topic-list) groups topics into a deep taxonomy. [Training Tracker](https://cp-training-tracker.vercel.app/) exposes Training, Statistics, and Upsolve navigation but its public page did not render feature detail in the research browser; its [source README](https://github.com/C0ldSmi1e/training-tracker) describes Codeforces-backed training and browser-local history. [Repovive](https://repovive.com/) offers a concise learn/solve/compete loop, but its contest and earning model is not AlgoGym's model. Socratic-AI's live page and the supplied InseLabs site were inaccessible during this audit; the [InseLabs LinkedIn profile](https://www.linkedin.com/company/inselabs/) was readable. Design Extractor was readable, but no export for these sites was available without submitting them to its service; tokens here are extracted manually. External content must be linked and attributed, not copied.

## Tokens and composition

Symm AI dark: background `#060B0A`, surface `#111816`, raised surface `#19211E`, border `#2C3732`, text `#F7FAF8`, secondary `#A5B3AB`, mint `#22FFA6`, cyan `#1DE7E0`. Symm AI light should use a warm white background and dark green ink with contrast-tested mint controls. The broader app uses semantic surface/text/accent tokens and keeps its existing identity. Use a 4px spacing unit, 8/12/16/24/32px rhythm, 10–14px control radii, a 720–820px lesson reading measure, and 150–300ms state transitions. Reduced motion removes nonessential animation.

Typography: Helvetica Neue where available, then Arial/Inter/system sans; UI body 14–16px, long-form lesson text 16–18px with 1.6–1.75 line height. Code uses a monospace stack. Header weights, contrast, and spacing establish hierarchy before borders or gradients.

## Screen decisions

Symm home: one focused prompt composer and short supporting line, official logo, visible language selector, secondary preferences, recent paths in a collapsible/sidebar library. Roadmap and lesson views retain existing persistence and tutoring but gain a consistent shell. Landing: hero, then the Symm AI showcase, then concise how-it-works and supporting-product sections. Training: overview, levels, sheets, upsolve, resource links, statistics. Pricing: honest plan comparison and a disabled paid CTA until a supported billing account and operational policies are configured.

## Motion and media

Generation animation uses the official mark as a single raster with opacity/scale and real job-stage text; individual logo pieces will not be faked from a flat image. The landing video should be a separate authentic production deliverable with captions, poster, mobile loading strategy, and user controls. The current reference recording is inspiration only and must not be embedded as AlgoGym content.
