## Approach: scan, and flood each new island

Walk every cell. When a `#` cell hasn't been visited, add one to the count and flood from it: BFS over the four neighbours, marking each `#` cell visited as it's queued. Every cell is visited once, by the scan or by a flood.

## Complexity

| | |
| --- | --- |
| Time | O(rows × columns) |
| Space | O(rows × columns) for the visited marks |

## Common mistakes

- Counting diagonal neighbours as connected (hidden test: a checkerboard has as many islands as fields).
- Recursive flood fill: one island covering the whole 300 × 300 grid is 90,000 calls deep (hidden test).
