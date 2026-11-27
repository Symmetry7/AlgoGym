1. If a capacity works, any larger capacity works too. That one-way property means you can binary search on the answer.
2. For a fixed capacity, a single greedy pass counts the days needed: keep adding bags to today until the next one doesn't fit.
3. The capacity can't be below the heaviest bag, and the total weight always works. Search between those two.
