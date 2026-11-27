class Solution:
    def canCross(self, reach: list[int]) -> bool:
        farthest = 0
        for i, r in enumerate(reach):
            if i > farthest:
                return False
            farthest = max(farthest, i + r)
        return True
