from collections import Counter


class Solution:
    def firstSingleVisit(self, visitors: list[str]) -> int:
        count = Counter(visitors)
        for i, v in enumerate(visitors):
            if count[v] == 1:
                return i
        return -1
