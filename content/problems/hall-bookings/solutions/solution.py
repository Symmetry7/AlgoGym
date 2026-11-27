class Solution:
    def maxBookings(self, requests: list[list[int]]) -> int:
        free = float("-inf")
        count = 0
        for start, end in sorted(requests, key=lambda r: r[1]):
            if start >= free:
                count += 1
                free = end
        return count
