## Approach: one pass over runs

Keep the start of the current run. When `signal[i]` differs from `signal[i − 1]`, the run `[start, i)` is complete: append the letter and `i − start`, then start a new run at `i`. After the loop, append the last run.

Build the output with a string builder (or a list joined at the end) so the total work stays linear.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(n) for the output |

## Common mistakes

- Forgetting the last run (hidden test: the string ends in a long run).
- Writing only one digit of the count, so a run of 12 becomes `"a2"` (hidden test: runs longer than 9).
- Repeated string concatenation in a loop, which is O(n²) in some languages.
