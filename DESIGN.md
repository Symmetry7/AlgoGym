# AlgoGym / SYMM AI visual system

Updated 2026-10-22. SYMM AI is the main learning entry point. Training, verified progress, and college communities support the learning path. Coins and AI credits remain separate products and balances.

## Visual direction

The marketing site is expressive; the AI workspace is calm. Both use the official SYMM mark, deep ink surfaces, IBM Plex Sans on the landing page, and lilac highlights. The homepage opens with the original flying-cube AlgoGym hero. The SYMM AI learning-path workflow follows as a separate section. The animated canvas field remains in the deeper showcase and workspace, where it stays behind text and controls, pauses offscreen, and has a static reduced-motion frame.

The dark palette uses page `#0D0B13`, composer `#211D27`, border `#65576E`, primary text `#F8F4FB`, secondary text `#C8BDCE`, and accent `#D5BDF4`. The Figma reference file records these as paint styles: [SYMM AI Visual System 3.0](https://www.figma.com/design/ukiuhMRHTkCPLl0m5oro9B).

## Composition and behavior

- Landing hero: the original competitive-programming headline, platform marks, Google action, and interactive flying cubes remain the first impression.
- SYMM introduction: a concise statement sits above an interactive product window. A binary-search question leads into a four-step path and a valid-answer boundary. Selecting a step changes the lesson and progress.
- SYMM empty state: official mark, “Meet SYMM AI.”, one animated thought, concise supporting sentence, then the prompt.
- Composer: approximately 780 × 68px at rest on desktop, one line by default, grows only for content, and caps at 144px with internal scrolling. Enter submits and Shift+Enter inserts a line break. The programming-language control remains visible.
- Showcase: a real interactive dynamic-programming grid teaches how path counts combine. It replaces the former video; there is no video element or video asset in this area.
- Reduced motion: static first phrase and static field; the interface remains legible and complete.

## Product constraints

Keep the existing saved paths, lessons, tutor conversations, authentication, credits, and training rules. Do not imply paid checkout is live until billing is operational. Do not claim measured learning outcomes. The grid and sample code in the showcase are illustrative previews.

Coin exchanges are 1,000 Coins for 10 AI credits or 10,000 Coins for 100 AI credits. The server uses an authenticated, idempotent database transaction; deploy the coin-credit migration before enabling live redemption.

## References

Google Gemini informed compact composer proportions and action placement. ChatGPT and Claude informed the calm conversation workspace; Linear and Raycast informed precise control states and restrained motion; React Bits informed pointer-aware background techniques without using a preset; Component Gallery informed textarea and control semantics. These are principles, not copied screens or branding.
