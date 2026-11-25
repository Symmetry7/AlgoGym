1. Flip the question: given a daily limit `X`, can you finish in `days` days?
2. With a fixed `X`, reading greedily (keep adding chapters until the next one would exceed `X`) uses the fewest days.
3. If limit `X` works, every larger limit works too. That makes the answer searchable with binary search.
4. The answer is at least the longest chapter and at most the total page count.
