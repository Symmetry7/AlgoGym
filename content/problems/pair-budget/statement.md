A gift shop lists its prices in non-decreasing order: `prices[0] ≤ prices[1] ≤ …`. You want to buy two different items and spend at most `budget` in total.

Return the number of index pairs `(i, j)` with `i < j` such that `prices[i] + prices[j] ≤ budget`.

## Constraints

- `2 ≤ prices.length ≤ 10^5`
- `1 ≤ prices[i] ≤ 2 × 10^9`, and `prices` is sorted in non-decreasing order
- `1 ≤ budget ≤ 2 × 10^9`
