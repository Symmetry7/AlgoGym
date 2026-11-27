## Approach: a min-heap of the best `k`

Scan the scores with a min-heap that never holds more than `k` values. Push each score; if the heap grows past `k`, pop its minimum. After the scan, the heap holds the `k` largest scores; sort them from highest to lowest. With small `k` this is O(n log k), much less than sorting everything.

(Sorting all scores and taking the top `k` is also accepted. The heap version is what interviews look for when `k` is much smaller than `n`.)

## Complexity

| | |
| --- | --- |
| Time | O(n log k + k log k) |
| Space | O(k) |

## Common mistakes

- Dropping duplicates: equal scores each take a place (hidden test).
- Using a max-heap of everything and popping `k` times: correct, but O(n) extra memory.
