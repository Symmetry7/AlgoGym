## Approach: variable sliding window with last-seen positions

Scan with `right` from 0 to n − 1 and keep `last[id]`, the most recent index where each id was played. Before adding `songs[right]`, if its last play is inside the window, move `left` to `last[id] + 1`. The window `[left, right]` then has no repeats; record its length.

## Complexity

| | |
| --- | --- |
| Time | O(n) expected, with a hash map |
| Space | O(n) |

## Common mistakes

- Setting `left = last[id] + 1` without `max`: an id last seen before the window pulls `left` backwards and lets a repeat back in (hidden test: `[1, 2, 2, 1]`, answer 2).
- Clearing the whole set and restarting at `right`: that drops plays that are still valid.
