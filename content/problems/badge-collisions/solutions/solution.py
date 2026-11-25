class Solution:
    def countSharedBadgePairs(self, badges: list[str]) -> int:
        seen: dict[str, int] = {}
        pairs = 0
        for code in badges:
            earlier = seen.get(code, 0)
            pairs += earlier
            seen[code] = earlier + 1
        return pairs
