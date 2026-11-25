class Solution:
    def rangeTotals(self, values: list[int], lefts: list[int], rights: list[int]) -> list[int]:
        prefix = [0]
        for v in values:
            prefix.append(prefix[-1] + v)
        return [prefix[r + 1] - prefix[l] for l, r in zip(lefts, rights)]
