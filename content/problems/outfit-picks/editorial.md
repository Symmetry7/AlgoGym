## Approach: include or exclude, recursively

`go(i)` has decided items `0` to `i − 1`; the current choices are in `cur`. If `i == n`, record a copy of `cur`. Otherwise call `go(i + 1)` without item `i`, then append item `i`, call `go(i + 1)` again and pop it. The recursion tree has depth `n` and `2^n` leaves, one per pick, and items are always added in input order.

## Complexity

| | |
| --- | --- |
| Time | O(n · 2^n): 2^n picks, each copied in O(n) |
| Space | O(n) recursion depth, plus the output |

## Common mistakes

- Recording `cur` itself instead of a copy: every pick then ends up empty after backtracking.
- Forgetting the empty pick (hidden test: one item expects `[[], ["watch"]]`).
