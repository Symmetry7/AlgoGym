class Solution:
    def countPairsWithTotal(self, amounts: list[int], target: int) -> int:
        seen: dict[int, int] = {}
        pairs = 0
        for x in amounts:
            pairs += seen.get(target - x, 0)
            seen[x] = seen.get(x, 0) + 1
        return pairs
