## Approach: lower bound

The answer is the first index whose time is at least `arrival`. Everything before it is smaller, everything from it on is at least `arrival`, so the array splits into two runs and binary search finds the boundary.

Keep `lo = 0` and `hi = n`. While `lo < hi`, look at `mid = (lo + hi) / 2`. If `departures[mid] < arrival`, the boundary is to the right, so `lo = mid + 1`; otherwise `hi = mid`. When they meet, `lo` is the answer, and it is `n` when no train qualifies.

## Complexity

| | |
| --- | --- |
| Time | O(log n) |
| Space | O(1) |

## Common mistakes

- Returning as soon as `departures[mid] == arrival`: with several trains in the same minute that may not be the first one (hidden test: `[1, 3, 3, 3, 9]` with `arrival = 3` expects `1`).
- Searching in `[0, n − 1]` and forgetting the "all trains left" answer `n`.
