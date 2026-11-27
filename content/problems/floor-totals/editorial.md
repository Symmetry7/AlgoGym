## Approach: breadth-first search, one level per round

Keep the current level's nodes. Sum their values (in a 64-bit integer), append the sum to the answer, and build the next level from their children. Stop when a level is empty. Each node is handled once.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(n) |

## Common mistakes

- Summing in 32-bit integers: 5 × 10^4 nodes × 10^9 overflows (hidden test).
- Depth-first recursion on a 10^5-node chain overflows the stack in several languages (hidden test).
