Stones cross a river in a straight line, numbered `0` to `n − 1`. From stone `i` you can jump forward to any stone from `i + 1` up to `i + reach[i]`. A stone with `reach[i] = 0` is a dead end.

You start on stone `0`. Return `true` if you can reach the last stone, and `false` otherwise.

## Constraints

- `1 ≤ n ≤ 10^5`, where `n = reach.length`
- `0 ≤ reach[i] ≤ 10^5`
