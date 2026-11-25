class Solution:
    def longestQuietRun(self, levels: list[int], limit: int) -> int:
        best = current = 0
        for level in levels:
            current = current + 1 if level <= limit else 0
            best = max(best, current)
        return best
