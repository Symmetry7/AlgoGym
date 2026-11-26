class Solution:
    def minCapacity(self, bags: list[int], days: int) -> int:
        def days_needed(cap: int) -> int:
            used, load = 1, 0
            for b in bags:
                if load + b > cap:
                    used += 1
                    load = 0
                load += b
            return used

        lo, hi = max(bags), sum(bags)
        while lo < hi:
            mid = (lo + hi) // 2
            if days_needed(mid) <= days:
                hi = mid
            else:
                lo = mid + 1
        return lo
