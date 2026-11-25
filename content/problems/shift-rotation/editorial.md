## Approach: reduce `k`, then place each entry directly

Rotating `n` times is the identity, so only `k mod n` rotations matter. After `k` rotations, the entry at index `i` sits at index `(i + k) mod n`. Build the result by writing every entry to its new index.

(An in-place alternative reverses the whole array, then the first `k` entries, then the rest.)

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(n) for the result |

## Common mistakes

- Not reducing `k`: slicing the last `k` entries breaks when `k > n` (hidden tests: `k = n + 1` and `k = 10^9`).
- Rotating left instead of right: the last entry must move to the front.
