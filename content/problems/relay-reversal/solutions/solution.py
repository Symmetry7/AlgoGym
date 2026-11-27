class Solution:
    def reverseRelay(self, values: list[int], next: list[int], head: int) -> list[int]:
        link = next[:]
        prev, cur = -1, head
        while cur != -1:
            ahead = link[cur]
            link[cur] = prev
            prev, cur = cur, ahead
        order = []
        node = prev
        while node != -1:
            order.append(values[node])
            node = link[node]
        return order
