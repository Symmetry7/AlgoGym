A help desk records the minute each support ticket was opened. `times` is sorted in non-decreasing order, and several tickets can open in the same minute.

For each `queries[j]`, count the tickets opened at or before minute `queries[j]`. Return the counts in the same order as `queries`.

## Constraints

- `1 ≤ times.length, queries.length ≤ 10^5`
- `0 ≤ times[i], queries[j] ≤ 10^9`, and `times` is sorted in non-decreasing order
- `queries` is in any order.
