class Solution:
    def isMirror(self, values: list[int], left: list[int], right: list[int], root: int) -> bool:
        queue = [(left[root], right[root])]
        head = 0
        while head < len(queue):
            a, b = queue[head]
            head += 1
            if a == -1 and b == -1:
                continue
            if a == -1 or b == -1 or values[a] != values[b]:
                return False
            queue.append((left[a], right[b]))
            queue.append((right[a], left[b]))
        return True
