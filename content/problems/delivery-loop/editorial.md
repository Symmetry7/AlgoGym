## Approach: Floyd's cycle detection

Move `slow` one step and `fast` two steps until `fast` hits the end (no loop) or the two meet. Say the tail before the loop has length `a`, the meeting point is `b` steps into the loop, and the loop has length `L`. Fast walked twice as far as slow: `2(a + b) = a + b + kL`, so `a = kL − b`. Walking `a` more steps from the meeting point therefore lands on the loop start, the same place a walker starting at `head` reaches after `a` steps. Move both one step at a time until they meet.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(1) |

## Common mistakes

- Returning the meeting point: it is somewhere inside the loop, not necessarily its start (hidden tests where the tail and the loop have different lengths).
- Missing a self-loop, where a stop points to itself (hidden test).
