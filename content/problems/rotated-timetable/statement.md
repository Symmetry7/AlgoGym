A station's display shows train numbers in increasing order, but it scrolls: it starts somewhere in the middle of the list, runs to the end, then wraps around to the beginning. The numbers are all different.

Given the display `trains` and a train number `target`, return the index where `target` appears, or `-1` if it isn't shown. Aim for O(log n) time.

## Constraints

- `1 ≤ trains.length ≤ 10^5`
- `−10^9 ≤ trains[i], target ≤ 10^9`, all values in `trains` distinct
- `trains` is a sorted array rotated by some amount (possibly zero)
