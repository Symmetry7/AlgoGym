## Approach: prefix sums with a hash map

Keep a running total `s` and `seen[total]`, the number of earlier prefixes with that total; start with `seen[0] = 1` for the empty prefix. For each day, add `changes[i]` to `s`, add `seen[s − target]` to the answer (one stretch per earlier prefix), then increment `seen[s]`.

## Complexity

| | |
| --- | --- |
| Time | O(n) expected |
| Space | O(n) for the map |

## Common mistakes

- Using a sliding window: it assumes every change is positive (hidden test: refunds inside the stretch).
- Forgetting `seen[0] = 1`: stretches that start on day 0 are missed (hidden test: the whole array is the only answer).
- 10^5 zero days with target 0 give 5,000,050,000 stretches: the count needs `long`.
