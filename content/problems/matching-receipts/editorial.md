## Approach: one pass with a count of earlier values

Keep `seen[value]`, the number of earlier receipts with that value. For each receipt `x`, add `seen[target − x]` to the answer, then increment `seen[x]`. Counting before recording means a receipt is never paired with itself, and each pair is counted once.

Compute `target − x` in 64-bit arithmetic: it can reach 3 × 10^9.

## Complexity

| | |
| --- | --- |
| Time | O(n) expected |
| Space | O(n) for the map |

## Common mistakes

- Counting from a map of all values: when `2x == target`, the receipt pairs with itself (hidden test: every amount is `target / 2`).
- The answer can reach about 5 × 10^9 (10^5 equal receipts), so it needs `long`.
- Checking every pair is O(n²), too slow for 10^5 receipts.
