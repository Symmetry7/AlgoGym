1. Scanning `times` for every query is O(n · q), up to 10^10 steps.
2. In a sorted list, the tickets opened at or before `q` form a prefix. You need the length of that prefix.
3. Binary search for the first time that is **greater** than `q`; its index is the count. Tickets opened exactly at `q` must be included.
