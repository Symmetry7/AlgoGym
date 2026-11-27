## Approach: compare mirrored pairs with a queue

Put the pair `(left[root], right[root])` in a queue. Repeatedly take a pair `(a, b)`. If both are `-1`, continue. If only one is `-1`, or their values differ, the tree isn't a mirror. Otherwise push `(left[a], right[b])` and `(right[a], left[b])`: the outer pair and the inner pair. If the queue empties without a mismatch, the tree is a mirror. The queue avoids deep recursion on long, thin trees.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(n) for the queue |

## Common mistakes

- Pairing `left[a]` with `left[b]`: that checks whether the halves are identical, not mirrored (hidden test).
- Comparing only values and not shape (hidden test: equal values, one-sided children).
