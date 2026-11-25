## Approach: two pointers, always move the shorter wall

Start with `lo = 0`, `hi = n − 1` and record their area. The shorter of the two walls can't do better with any wall between them (width shrinks, height can't exceed it), so discard it: move `lo` right if `heights[lo] ≤ heights[hi]`, otherwise move `hi` left. Repeat until the pointers meet.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(1) |

## Common mistakes

- Moving the taller wall: it can discard the best tank (hidden test: `[1, 8, 6, 2, 5, 4, 8, 3, 7]`, answer 49).
- Checking every pair: O(n²), too slow for 10^5 panels.
