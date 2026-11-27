A playlist is stored as a linked list, and the listener wants to remove the song that is `k` places from the end.

Nodes are numbered `0` to `n − 1`. `next[i]` is the node after node `i`, or `-1` if node `i` is the last one. Song `i` has id `values[i]`, and `head` is the first song.

Remove the `k`-th song from the end (`k = 1` is the last song) and return the remaining song ids in playlist order. Try to find the song in a single pass.

## Constraints

- `1 ≤ n ≤ 10^5`, where `n = values.length = next.length`
- following `next` from `head` visits every node exactly once and ends at `-1`
- `1 ≤ k ≤ n`
- `−10^9 ≤ values[i] ≤ 10^9`
