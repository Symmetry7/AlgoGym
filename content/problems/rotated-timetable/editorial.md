## Approach: binary search with a sorted half

At every step, either `[lo, mid]` or `[mid, hi]` is in increasing order, because the wrap-around point can only be on one side. If `trains[lo] ≤ trains[mid]`, the left half is sorted: if `trains[lo] ≤ target < trains[mid]` search left, otherwise search right. Otherwise the right half is sorted: if `trains[mid] < target ≤ trains[hi]` search right, otherwise left. Each step halves the range.

## Complexity

| | |
| --- | --- |
| Time | O(log n) |
| Space | O(1) |

## Common mistakes

- Using `<` instead of `≤` in `trains[lo] ≤ trains[mid]`: when `lo == mid` the one-element left half is sorted (hidden test: `[3, 1]` with `target = 1`).
- Finding the rotation point first and then forgetting the case with no rotation.
