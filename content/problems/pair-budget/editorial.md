## Approach: two pointers from both ends

Start with `lo = 0` and `hi = n − 1`.

- If `prices[lo] + prices[hi] ≤ budget`, then `prices[lo]` also fits with every cheaper item between them, which is `hi − lo` pairs. Add them and move `lo` right.
- Otherwise `prices[hi]` is too expensive to pair with anything left, so move `hi` left.

Each step moves one pointer, so the loop runs at most n times.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(1) |

## Common mistakes

- Adding two `int` prices: 2 × 10^9 + 2 × 10^9 overflows to a negative number that looks affordable (hidden test: two prices of 2 × 10^9 with a budget of 2 × 10^9, answer 0). Add them as 64-bit integers.
- The count can reach about 5 × 10^9 (10^5 items priced 1), so the total needs `long` too.
- Counting `(i, i)` or both `(i, j)` and `(j, i)`.
