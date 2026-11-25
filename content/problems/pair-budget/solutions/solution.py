class Solution:
    def countAffordablePairs(self, prices: list[int], budget: int) -> int:
        lo, hi = 0, len(prices) - 1
        pairs = 0
        while lo < hi:
            if prices[lo] + prices[hi] <= budget:
                pairs += hi - lo
                lo += 1
            else:
                hi -= 1
        return pairs
