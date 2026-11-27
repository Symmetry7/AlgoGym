A train's coaches are coupled one after another, and each coach only knows the coach behind it. The pantry car must go in the middle coach, and you have to find it in a single walk along the train.

The coaches form a linked list. Nodes are numbered `0` to `n − 1`. `next[i]` is the node after node `i`, or `-1` if node `i` is the last one. Coach `i` has number `values[i]`, and `head` is the engine-side coach.

Return the number of the middle coach. With an even number of coaches there are two middles; return the second one.

## Constraints

- `1 ≤ n ≤ 10^5`, where `n = values.length = next.length`
- following `next` from `head` visits every node exactly once and ends at `-1`
- `−10^9 ≤ values[i] ≤ 10^9`
