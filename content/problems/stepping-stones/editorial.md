## Approach: track the farthest reachable stone

Keep `farthest = 0`. For each stone `i` in order: if `i > farthest`, stone `i` can't be reached, and neither can anything after it, so return `false`. Otherwise set `farthest = max(farthest, i + reach[i])`. If the loop finishes, the last stone was reachable. Every stone up to `farthest` is reachable, because a jump can land on any stone in its range.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(1) |

## Common mistakes

- Always taking the longest jump: it can land on a dead end that a shorter jump avoids (hidden test).
- Trying every path with recursion or a 2-D table: O(n · reach) times out (hidden test).
