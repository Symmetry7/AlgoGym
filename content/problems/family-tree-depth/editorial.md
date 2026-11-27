## Approach: count the levels (breadth-first)

Start with the level `[root]`. While the level isn't empty, count it and replace it with the children of its nodes. The number of levels is the depth. This visits each node once and never recurses, so a chain of 10^5 nodes is as easy as a balanced tree.

The recursive formula `depth(node) = 1 + max(depth(left), depth(right))` is equivalent, but its call stack grows with the tree's height.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(width of the widest level) |

## Common mistakes

- Deep recursion: a chain of 10^5 nodes overflows the default stack in several languages (hidden test).
- Counting edges instead of nodes, which is one less (hidden test: a single node has depth `1`).
