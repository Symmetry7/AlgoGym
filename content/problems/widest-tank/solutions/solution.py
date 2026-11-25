class Solution:
    def maxTankArea(self, heights: list[int]) -> int:
        lo, hi = 0, len(heights) - 1
        best = 0
        while lo < hi:
            best = max(best, (hi - lo) * min(heights[lo], heights[hi]))
            if heights[lo] <= heights[hi]:
                lo += 1
            else:
                hi -= 1
        return best
