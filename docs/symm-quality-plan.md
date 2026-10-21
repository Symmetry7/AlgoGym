# Symm AI quality and ThemeCP implementation

Spec: user release brief and corrections of 21 October 2026.

## Global constraints

Preserve existing auth, courses, verified reward ledger and uncommitted work.
No paid media: user selected motion graphics only. No copied source implementation
from Training Tracker (no license found in its repository tree). Attribute ThemeCP
and implement its published training method independently. Do not call training
performance an official Codeforces rating. No production data writes in testing.

### Task 1: Learning content rendering

Extract a shared renderer for lessons and tutoring. Handle fenced code through
the existing syntax highlighter, semantic tables/lists, math and readable spacing.
Write a rendering test with Markdown code, math and a table; observe failure
before implementation. Run focused tests and TypeScript. Expected: formatted
blocks and accessible copy controls without invalid nested pre elements.

### Task 2: ThemeCP training rounds

Implement published level targets, four distinct unsolved problems with a shared
topic, bounded rounds, persisted local round history, and accepted-solve timestamps.
Keep local practice progression distinct from server-authoritative coins. Test
level 1/49/97 targets, duplicate exclusion, incomplete pools, and time-window
scoring. Expected: no partial or already-solved round is silently started.

### Task 3: Visual refinement

Use compact training navigation and a focused round builder. Refine roadmap
presentation and pricing against the supplied image, with a violet Pro card.
Replace the small raster mark with an original crisp rotational vector mark
as explicitly requested in the latest correction. Preserve prior asset.
Expected: both themes and mobile remain readable and controls work.

### Task 4: Product introduction

Author a silent 35–50 second motion graphic using real rendered product captures,
clearly marked demonstration content, typography and the new mark. No paid model
calls, copied reference footage or unlicensed music. Add poster, controls,
captions/transcript and preload none. Expected: an actual playable media artifact,
not a promise or simulated progress bar.

### Task 5: Verification and review

Run complete unit suite, typecheck, build, desktop/mobile browser interactions,
and inspect screenshots/media. Request one fresh-context code review of the
changes, resolve important findings with regression tests. Record limitations.

## Interfaces

Task 1 exports RichText and CodeExample consumed by the existing Symm workspace.
Task 2 consumes existing Problem and TrackedSolve types; Task 3 mounts its panel.
Task 4 captures Task 3 UI and mounts in the existing landing showcase.

## Review focus

Time-window solve evidence, duplicate round completion, malformed local storage,
Markdown nesting, theme contrast, mobile overflow, video payload/loading, absence
of real-data mutations and paid calls. Billing remains unavailable.
