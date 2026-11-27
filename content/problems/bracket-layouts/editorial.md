## Approach: backtracking with two counters

Track `open` (opening brackets used) and `close` (closing brackets used). The current depth is `open − close`. From any prefix, add `(` if `open < pairs` and `open − close < maxDepth`, and add `)` if `close < open`. When the length reaches `2 × pairs`, the string is complete. Every branch the rules allow leads to a valid answer, so the work is proportional to the output.

## Complexity

| | |
| --- | --- |
| Time | O(pairs × answer count); at most the 10th Catalan number, 16,796 strings |
| Space | O(pairs) recursion depth, plus the output |

## Common mistakes

- Generating all 2^(2 × pairs) strings and filtering: about a million strings at `pairs = 10`.
- Checking the depth limit only at the end instead of while building (hidden tests with `maxDepth = 1` expect just `()()…()`).
