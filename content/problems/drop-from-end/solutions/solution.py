class Solution:
    def dropFromEnd(self, values: list[int], next: list[int], head: int, k: int) -> list[int]:
        link = next[:]
        lead = head
        for _ in range(k):
            lead = link[lead]
        start = head
        if lead == -1:
            start = link[head]
        else:
            trail = head
            while link[lead] != -1:
                lead = link[lead]
                trail = link[trail]
            link[trail] = link[link[trail]]
        out = []
        node = start
        while node != -1:
            out.append(values[node])
            node = link[node]
        return out
