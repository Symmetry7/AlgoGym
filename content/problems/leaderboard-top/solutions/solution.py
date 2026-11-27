import heapq


class Solution:
    def topScores(self, scores: list[int], k: int) -> list[int]:
        heap = []
        for s in scores:
            if len(heap) < k:
                heapq.heappush(heap, s)
            elif s > heap[0]:
                heapq.heapreplace(heap, s)
        return sorted(heap, reverse=True)
