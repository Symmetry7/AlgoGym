import heapq


class Solution:
    def minJoinCost(self, cables: list[int]) -> int:
        heap = list(cables)
        heapq.heapify(heap)
        cost = 0
        while len(heap) > 1:
            joined = heapq.heappop(heap) + heapq.heappop(heap)
            cost += joined
            heapq.heappush(heap, joined)
        return cost
