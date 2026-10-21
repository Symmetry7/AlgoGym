# Symm AI introduction

Status: produced and integrated on 21 October 2026. No paid generation.

## Delivered assets

- `public/media/symm-intro.webm`: 42 seconds, 1280 x 720, 30 fps target, silent.
- `public/media/symm-intro-poster.webp`: static end-card poster.
- `public/media/symm-intro.vtt`: English captions.
- An expandable transcript beside the player.

The film uses original typography animation and screenshots of the actual local
AlgoGym interactive product preview. The illustrative course is labeled as a
product demonstration. It is not footage of a live AI generation or evidence of
provider latency. No generated application screens, paid media, reference footage,
user data, or third-party music are included.

## Reproduction

Start a local production build and run:

```powershell
$env:ALGOGYM_TEST_URL = 'http://127.0.0.1:8097'
node scripts/render-symm-intro.mjs
node scripts/check-symm-release.mjs
```

Chrome or Edge is required. The renderer captures the real product preview,
records canvas motion using MediaRecorder, then adds WebM duration metadata using
`@fix-webm-duration/fix` (development tooling only). Allow about one minute.
The metadata helper follows its [upstream documentation](https://github.com/yusitnikov/fix-webm-duration).

## Timeline

| Seconds | Scene |
| --- | --- |
| 0-6 | Learning algorithms should not feel like guesswork |
| 6-12 | Meet Symm AI |
| 12-18 | Ask a question and choose a language |
| 18-24 | Explore the roadmap |
| 24-30 | Understand the reasoning and code |
| 30-36 | Deliberate practice |
| 36-42 | First-principles tagline and AlgoGym attribution |

Playback is user initiated with controls and `preload="none"`. There is no
autoplay, so reduced-motion users receive a still poster until they choose to
play. The transcript remains available if WebM playback is unsupported. Chrome
playback, seeking, duration metadata, and desktop/mobile layout were tested.
Safari playback and an H.264 export have not been validated or produced.
