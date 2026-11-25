## Approach: count codes in a hash map

Walk the scans in order and keep `seen[code]`, how many earlier scans had this code. The new scan collides with each of them, so add `seen[code]` to the answer, then increment it.

## Complexity

| | |
| --- | --- |
| Time | O(n · L): one hash-map update per scan, where L ≤ 8 is the code length |
| Space | O(n) for the map |

## Common mistakes

- Overflow: 100,000 scans of one code give 4,999,950,000 pairs, more than a 32-bit `int` holds (hidden test: every scan has the same code). Use `long` / `long long` for the total.
- Counting ordered pairs (adding `c × (c − 1)`) doubles the answer.
