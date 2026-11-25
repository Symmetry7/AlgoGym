At a hackathon every entry to the hall is logged by scanning a badge; `badges[i]` is the code read on the `i`-th scan. Two scans **collide** when they read the same code.

Return the number of pairs of scans `(i, j)` with `i < j` that collide.

## Constraints

- `1 ≤ badges.length ≤ 10^5`
- `1 ≤ badges[i].length ≤ 8`
- `badges[i]` contains only lowercase letters and digits.
