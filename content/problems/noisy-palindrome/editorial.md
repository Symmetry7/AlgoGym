## Approach: two pointers from both ends

Start with `lo = 0` and `hi = n − 1`. Move `lo` right past non-alphanumeric characters and `hi` left likewise. If both point at letters or digits, compare them in lower case; a mismatch means `false`. Otherwise step both inwards. Reaching `lo ≥ hi` means `true`.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(1) |

## Common mistakes

- Comparing case-sensitively: `"Aa"` is a palindrome (hidden test).
- Treating digits as noise: `"1a2"` is not a palindrome (hidden test).
- Running a pointer past the other while skipping noise on a line that is all punctuation (hidden test: `"!?"`).
