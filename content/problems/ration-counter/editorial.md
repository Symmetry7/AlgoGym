## Approach: binary search on the capacity

Write `daysNeeded(c)`: walk through the bags, adding each to today's load, and start a new day when the next bag would exceed `c`. Filling each day as much as possible is optimal, because pushing a bag to a later day never helps.

`daysNeeded` only goes down as `c` grows, so the valid capacities are exactly the ones from some smallest value upwards. Binary search for it between `lo = max(bags)` (every bag must fit on its own) and `hi = sum(bags)` (everything in one day). If `daysNeeded(mid) ≤ days`, then `mid` works and the answer is at most `mid`; otherwise it is above `mid`.

## Complexity

| | |
| --- | --- |
| Time | O(n log S), where S is the total weight |
| Space | O(1) |

## Common mistakes

- Starting the search at 1 instead of the heaviest bag: a capacity below one bag's weight can never hand that bag out, and a naive count treats it as "fits" (hidden test: `[500, 1, 1, 1]` over 4 days expects `500`).
- Linear search over capacities: up to 2.5 × 10^7 candidates times n is far too slow.
