## Approach: upper-bound binary search per query

For a query `q`, find the first index `i` with `times[i] > q` (the "upper bound"). Every ticket before `i` opened at or before `q`, so the answer is `i`.

Keep `lo = 0`, `hi = n`. While `lo < hi`, look at `mid`: if `times[mid] ≤ q`, the boundary is to the right (`lo = mid + 1`); otherwise `hi = mid`.

## Complexity

| | |
| --- | --- |
| Time | O((n + q) · log n): q binary searches |
| Space | O(1) besides the output |

## Common mistakes

- Searching for the first time `≥ q` (lower bound): tickets opened exactly at minute `q` are then missed (hidden test: many tickets share the queried minute).
- Sorting `queries` and returning answers in sorted order instead of the original order.
