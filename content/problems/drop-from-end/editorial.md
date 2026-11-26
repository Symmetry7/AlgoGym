## Approach: a gap of `k` between two pointers

Advance `lead` by `k` nodes. If `lead` is now `-1`, the song to drop is the head, so the new head is `next[head]`. Otherwise start `trail` at `head` and move both until `next[lead]` is `-1`: the gap stays `k`, so `trail` is the node just before the one to remove. Set `next[trail] = next[next[trail]]` and read the list from the head.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(1) besides the output |

## Common mistakes

- Not handling `k = n` (removing the head), which leaves `trail` with nothing before it (hidden test).
- An off-by-one gap that removes the `(k + 1)`-th or `(k − 1)`-th song from the end.
