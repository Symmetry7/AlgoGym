## Approach: variable sliding window

Keep `left` and a running `total`. For each `right`, add `donations[right]`. **While** `total ≥ goal`, record `right − left + 1`, subtract `donations[left]` and move `left` right. Positive values guarantee that once the window falls below the goal, any shorter window ending here would too.

## Complexity

| | |
| --- | --- |
| Time | O(n): each index enters and leaves the window once |
| Space | O(1) |

## Common mistakes

- Shrinking only once (`if` instead of `while`): the window can stay longer than needed (hidden test: one huge donation after many small ones).
- Returning the first window that reaches the goal: later windows can be shorter.
- Returning infinity or n when the goal is never reached; the answer is `0` (hidden test).
