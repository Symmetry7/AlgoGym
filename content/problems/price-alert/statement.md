A price tracker records one closing price per day; `prices[i]` is day `i`. For each day, the tracker wants to know the first later day on which the price is **strictly higher**.

Return an array where entry `i` is that day's index, or `-1` if the price never goes higher after day `i`.

## Constraints

- `1 ≤ prices.length ≤ 10^5`
- `1 ≤ prices[i] ≤ 10^9`
