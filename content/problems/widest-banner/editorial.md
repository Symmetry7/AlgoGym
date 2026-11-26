## Approach: monotonic stack of rising heights

Keep indices on a stack with increasing heights. When shop `i` is shorter than the top, pop the top `j`: shop `i` is the first shorter shop to its right, and the new top (or `−1` if empty) is the first shorter one to its left. So the widest banner of height `heights[j]` has width `i − left − 1`. Process a sentinel of height 0 after the last shop so every index is popped. Use 64-bit integers: the area can reach 10^14.

## Complexity

| | |
| --- | --- |
| Time | O(n): each shop is pushed and popped once |
| Space | O(n) |

## Common mistakes

- 32-bit areas: 10^5 shops of height 10^9 give 10^14 (hidden test).
- Forgetting to flush the stack at the end: a strictly rising row never pops during the scan (hidden test).
- Trying every pair of edges: O(n²) times out on 10^5 shops.
