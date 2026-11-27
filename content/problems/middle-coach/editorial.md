## Approach: fast and slow pointers

Start `slow` and `fast` at `head`. While `fast` and `next[fast]` both exist, move `slow` one step and `fast` two steps. When `fast` stops, it has travelled about twice as far as `slow`, so `slow` is in the middle. With this stopping rule, an even-length train gives the second middle (for 4 coaches, `slow` ends on the third).

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(1) |

## Common mistakes

- Stopping one step early (`while next[next[fast]]` exists), which returns the first middle on even lengths (hidden test: two coaches expect the second).
- Reading `next[-1]` when the fast pointer runs off the end.
