## Approach: one recursion level per digit

`go(i, prefix)` has chosen letters for the first `i` digits. If `i` equals the length, `prefix` is a complete message. Otherwise, for each letter on key `digits[i]`, call `go(i + 1, prefix + letter)`. Start with `go(0, "")`, but return an empty list straight away for empty input. With a character buffer instead of string concatenation, each message costs O(n) to build.

## Complexity

| | |
| --- | --- |
| Time | O(n · 4^n) |
| Space | O(n) recursion depth, plus the output |

## Common mistakes

- Returning `[""]` for empty input (hidden test expects `[]`).
- Giving 7 and 9 three letters instead of four (hidden tests use both).
