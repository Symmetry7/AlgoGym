A shared wallet records the net change of each day; `changes[i]` can be negative (a refund) or zero.

Return the number of stretches of consecutive days whose changes add up to exactly `target`.

## Constraints

- `1 ≤ changes.length ≤ 10^5`
- `−10^4 ≤ changes[i] ≤ 10^4`
- `−10^9 ≤ target ≤ 10^9`
