In a school relay, each runner knows only who runs after them. The coach wants to run the race backwards, last runner first, without building a second list.

The runners form a linked list. Nodes are numbered `0` to `n − 1`. `next[i]` is the node after node `i`, or `-1` if node `i` is the last one. Runner `i` wears bib number `values[i]`, and `head` is the first runner.

Reverse the list by changing the links, then return the bib numbers in the new order, from the new head.

## Constraints

- `1 ≤ n ≤ 10^5`, where `n = values.length = next.length`
- following `next` from `head` visits every node exactly once and ends at `-1`
- `−10^9 ≤ values[i] ≤ 10^9`
