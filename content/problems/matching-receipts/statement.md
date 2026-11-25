An auditor suspects that some invoices were paid with exactly two receipts. `amounts[i]` is the value of receipt `i`; refunds are negative.

Return the number of pairs `(i, j)` with `i < j` such that `amounts[i] + amounts[j] == target`.

## Constraints

- `2 ≤ amounts.length ≤ 10^5`
- `−10^9 ≤ amounts[i] ≤ 10^9`
- `−2 × 10^9 ≤ target ≤ 2 × 10^9`
