## Approach: one pass with a running count

Every quiet run ends either at a loud hour or at the end of the array. Keep `current`, the length of the quiet run ending at the hour you are looking at, and `best`, the longest run so far.

- Quiet hour: `current += 1`, then `best = max(best, current)`.
- Loud hour: `current = 0`.

## Complexity

| | |
| --- | --- |
| Time | O(n): one pass over `levels` |
| Space | O(1): two integers |

## Common mistakes

- Returning `current` instead of `best`: the longest run is not always the last one (hidden test: a long run followed by a short one).
- Using `< limit`: a reading equal to `limit` is still quiet (hidden test: every reading equals `limit`).
