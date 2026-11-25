## Approach: binary search on the daily limit

`fits(X)`: walk the chapters, adding each to today's total; when the next chapter would push today past `X`, start a new day. `X` works if this uses at most `days` days. Greedy is optimal for a fixed `X` because ending a day earlier never helps.

`fits` is monotonic, so binary search `X` between `max(pages)` and `sum(pages)` for the smallest value that fits.

## Complexity

| | |
| --- | --- |
| Time | O(n · log(sum)): about 30 greedy passes |
| Space | O(1) |

## Common mistakes

- Starting the search at 1 with a `fits` that never checks a single chapter against `X`: a chapter longer than `X` then looks fine (hidden test: `[1, 100]` in 2 days, answer 100).
- Returning the first `X` that fits in a linear scan from 1: correct but far too slow for 10^5 chapters of 10^4 pages.
