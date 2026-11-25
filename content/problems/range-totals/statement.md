A fitness app stores one net calorie number per day in `values`, where a day can be negative. It answers many questions of the form "what was the total from day `lefts[j]` to day `rights[j]`, both included?".

Return the answers, one per question, in order.

## Constraints

- `1 ≤ values.length ≤ 10^5`
- `−10^4 ≤ values[i] ≤ 10^4`
- `1 ≤ lefts.length = rights.length ≤ 10^5`
- `0 ≤ lefts[j] ≤ rights[j] < values.length`
