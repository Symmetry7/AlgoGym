## Approach: earliest end first

Sort the requests by `end`. Walk through them, keeping `free`, the minute the hall becomes free (start with the smallest possible value). Accept a request when `start ≥ free`, then set `free = end`.

Why it's optimal: some best schedule can always be rearranged to begin with the request that ends earliest, since swapping it in frees the hall no later. Repeat the argument on what's left.

## Complexity

| | |
| --- | --- |
| Time | O(n log n) for the sort |
| Space | O(n) for the sorted copy |

## Common mistakes

- Sorting by start time: one long early booking blocks many short ones (hidden test).
- Treating touching bookings as overlapping: `[1, 3]` and `[3, 5]` can both be accepted (hidden test).
