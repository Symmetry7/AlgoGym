## Approach: breadth-first search on an adjacency list

Build, for each station, the list of stations one segment away. Then run BFS from `source` with a `dist` array set to `-1`: set `dist[source] = 0`, and for each station taken from the queue, give every neighbour with `dist = -1` the distance `dist[current] + 1` and queue it. BFS finishes a whole distance before starting the next, so the first time a station is reached is with its fewest hops. Return `dist[target]`.

## Complexity

| | |
| --- | --- |
| Time | O(n + edges) |
| Space | O(n + edges) |

## Common mistakes

- Depth-first search: it finds a path, not the shortest one (hidden test where the first branch is a detour).
- Marking stations only when they leave the queue, so a station is queued many times on dense maps.
- Forgetting that `source = target` needs `0` hops (hidden test).
