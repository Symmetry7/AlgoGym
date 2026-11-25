class Solution:
    def minDailyLoad(self, pages: list[int], days: int) -> int:
        def fits(limit: int) -> bool:
            used, today = 1, 0
            for p in pages:
                if today + p > limit:
                    used += 1
                    today = 0
                today += p
            return used <= days

        lo, hi = max(pages), sum(pages)
        while lo < hi:
            mid = (lo + hi) // 2
            if fits(mid):
                hi = mid
            else:
                lo = mid + 1
        return lo
