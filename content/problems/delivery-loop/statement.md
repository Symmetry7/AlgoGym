A delivery app gives each stop a pointer to the next stop. A bug may have created a loop, sending riders round the same stops forever.

The stops form a linked list. Nodes are numbered `0` to `n − 1`. `next[i]` is the node after node `i`, or `-1` if node `i` is the last one. The route starts at `head`.

If following `next` from `head` eventually repeats a stop, return the first stop on the route that is part of the loop. Otherwise return `-1`. Try to use O(1) extra memory.

## Constraints

- `1 ≤ next.length ≤ 10^5`
- `−1 ≤ next[i] < next.length`
- `0 ≤ head < next.length`; stops not reachable from `head` can be ignored
