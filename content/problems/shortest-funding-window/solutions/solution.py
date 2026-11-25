class Solution:
    def shortestWindowAtLeast(self, donations: list[int], goal: int) -> int:
        left = total = best = 0
        for right, d in enumerate(donations):
            total += d
            while total >= goal:
                length = right - left + 1
                if best == 0 or length < best:
                    best = length
                total -= donations[left]
                left += 1
        return best
