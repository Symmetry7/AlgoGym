## Approach: prefix sums

Build `prefix` of length `n + 1` with `prefix[0] = 0` and `prefix[i + 1] = prefix[i] + values[i]`. Each question is then one subtraction: `prefix[rights[j] + 1] − prefix[lefts[j]]`.

## Complexity

| | |
| --- | --- |
| Time | O(n + q) |
| Space | O(n) for the prefix array |

## Common mistakes

- Off by one: `prefix[r] − prefix[l]` drops day `r` (hidden test: single-day ranges).
- Summing every range directly: O(n · q), too slow when ranges are long (hidden test: 20,000 questions spanning almost the whole array).
