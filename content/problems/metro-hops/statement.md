A metro map has `n` stations numbered `0` to `n − 1`. Each entry `[a, b]` in `edges` is a line segment you can ride in either direction between stations `a` and `b`.

Return the fewest segments you need to ride to get from `source` to `target`, or `-1` if `target` can't be reached.

## Constraints

- `1 ≤ n ≤ 10^5`
- `0 ≤ edges.length ≤ 10^5`, each `edges[i] = [a, b]` with `0 ≤ a, b < n` and `a ≠ b`; a pair may appear more than once
- `0 ≤ source, target < n`
