## Approach: monotonic stack of waiting days

Keep a stack of day indices still waiting for a higher price. For each day `i`:

1. While the stack's top day has a price **lower** than `prices[i]`, pop it and set its answer to `i`.
2. Push `i`.

Days left on the stack at the end get `-1`. Each day is pushed and popped at most once.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(n) for the stack |

## Common mistakes

- Popping on `≤` instead of `<`: an equal price is not higher (hidden test: runs of equal prices).
- The nested "look ahead" loop is O(n²) on a falling market (hidden test: 10^5 strictly decreasing prices).
