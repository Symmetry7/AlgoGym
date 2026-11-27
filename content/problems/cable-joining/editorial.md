## Approach: always join the two shortest (greedy with a min-heap)

Put every length in a min-heap. While more than one cable is left, pop the two shortest `x` and `y`, add `x + y` to the cost, and push `x + y` back. This is the same rule as building a Huffman code: a length is paid once per join it takes part in, so the shortest cables should take part in the most joins and the longest in the fewest. Joining the two shortest first does exactly that, and an exchange argument shows no other order is cheaper.

## Complexity

| | |
| --- | --- |
| Time | O(n log n) |
| Space | O(n) |

## Common mistakes

- Joining in the given order, or sorting once and joining left to right: the joined cable must go back among the others (hidden test).
- 32-bit totals: the cost can reach about 1.7 × 10^10 (hidden test).
