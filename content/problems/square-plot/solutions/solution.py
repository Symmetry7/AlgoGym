class Solution:
    def largestSide(self, area: int) -> int:
        lo, hi = 0, min(area, 31622777)
        while lo < hi:
            mid = (lo + hi + 1) // 2
            if mid * mid <= area:
                lo = mid
            else:
                hi = mid - 1
        return lo
