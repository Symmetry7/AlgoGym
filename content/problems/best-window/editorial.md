## Approach: fixed-size sliding window

Sum the first `k` readings; that is the first window and the starting `best`. Then for each `i` from `k` to `n − 1`, add `readings[i]` and subtract `readings[i − k]`, and update `best`.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(1) |

## Common mistakes

- Initialising `best = 0`: when every reading is negative the answer is negative (hidden test: all readings negative).
- Off-by-one when sliding: the reading that leaves is `readings[i − k]`, not `readings[i − k − 1]`.
