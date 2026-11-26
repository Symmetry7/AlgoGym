## Approach: monotonic stack of waiting days

Keep a stack of indices whose warmer day hasn't arrived. Their temperatures never increase from bottom to top, because a warmer day would already have answered the ones below it. For each new day `i`, pop every index `j` with `temps[j] < temps[i]` and set `answer[j] = i − j`, then push `i`. Indices left on the stack keep the answer `0`.

## Complexity

| | |
| --- | --- |
| Time | O(n): each index is pushed and popped at most once |
| Space | O(n) |

## Common mistakes

- Popping on `≤` instead of `<`: an equal temperature is not warmer (hidden test: all days at 30°C expect all zeros).
- Nested loops: a strictly falling week of 10^5 days makes the O(n²) scan time out (hidden test).
