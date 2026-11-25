from bisect import bisect_right


class Solution:
    def countOpenedBy(self, times: list[int], queries: list[int]) -> list[int]:
        return [bisect_right(times, q) for q in queries]
