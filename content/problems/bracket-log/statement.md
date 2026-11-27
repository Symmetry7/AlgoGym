A code formatter strips everything except brackets from a file and writes the rest to a log, so the log contains only `(`, `)`, `[`, `]`, `{` and `}`.

Given the log `log`, return `true` if every opening bracket is closed by the same kind of bracket, in the right order, and every closing bracket has an opening one. Otherwise return `false`.

## Constraints

- `1 ≤ log.length ≤ 10^5`
- `log` contains only `()[]{}`
