class Solution:
    def firstDeparture(self, departures: list[int], arrival: int) -> int:
        lo, hi = 0, len(departures)
        while lo < hi:
            mid = (lo + hi) // 2
            if departures[mid] < arrival:
                lo = mid + 1
            else:
                hi = mid
        return lo
