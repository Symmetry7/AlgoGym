class Solution:
    def levelTotals(self, values: list[int], left: list[int], right: list[int], root: int) -> list[int]:
        totals = []
        level = [root]
        while level:
            totals.append(sum(values[node] for node in level))
            nxt = []
            for node in level:
                if left[node] != -1:
                    nxt.append(left[node])
                if right[node] != -1:
                    nxt.append(right[node])
            level = nxt
        return totals
