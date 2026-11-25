class Solution:
    def maxWindowSum(self, readings: list[int], k: int) -> int:
        window = sum(readings[:k])
        best = window
        for i in range(k, len(readings)):
            window += readings[i] - readings[i - k]
            best = max(best, window)
        return best
