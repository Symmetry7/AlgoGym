## Approach: reverse the links in one pass

Start with `prev = -1` and `cur = head`. Repeat: save `ahead = next[cur]`, set `next[cur] = prev`, then move `prev = cur` and `cur = ahead`. When `cur` becomes `-1`, every link points backwards and `prev` is the new head. Walk from there to read the bib numbers.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(1) besides the output |

## Common mistakes

- Overwriting `next[cur]` before saving it, which cuts off the rest of the list.
- Assuming node `0` is the head, or that `next` runs `0 → 1 → 2 …` (hidden tests use shuffled links).
