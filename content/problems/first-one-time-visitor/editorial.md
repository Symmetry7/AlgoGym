## Approach: count, then scan

Pass 1: count each id in a hash map. Pass 2: return the first index `i` with `count[visitors[i]] == 1`, or `-1`.

## Complexity

| | |
| --- | --- |
| Time | O(n · L), with L ≤ 8 |
| Space | O(n) for the map |

## Common mistakes

- Only checking whether the id appears **later**: in `["b", "b", "c"]` the second `"b"` has no later copy but is still a repeat visitor; the answer is 2 (hidden test).
- Searching the whole log for each entry is O(n²).
