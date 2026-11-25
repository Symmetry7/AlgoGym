class Solution:
    def countTargetStretches(self, changes: list[int], target: int) -> int:
        seen = {0: 1}
        total = count = 0
        for c in changes:
            total += c
            count += seen.get(total - target, 0)
            seen[total] = seen.get(total, 0) + 1
        return count
