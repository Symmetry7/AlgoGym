1. Checking all pairs is O(n²), too slow for 10^5 prices. Use the fact that the list is sorted.
2. Put one pointer on the cheapest item and one on the most expensive. What does it tell you if they fit the budget together?
3. If `prices[lo] + prices[hi] ≤ budget`, then `lo` pairs with every index from `lo + 1` to `hi`. Count them all at once and move `lo` right. Otherwise move `hi` left.
4. Two prices can add up to 4 × 10^9, which overflows a 32-bit `int`.
