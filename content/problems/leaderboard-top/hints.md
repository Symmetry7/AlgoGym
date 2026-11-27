1. Sorting everything works in O(n log n). Can you keep only what you need?
2. Keep the best `k` seen so far. Which of them would a new score push out?
3. A min-heap of size `k` keeps its smallest member on top: replace it when a bigger score arrives. Sort the `k` survivors at the end.
