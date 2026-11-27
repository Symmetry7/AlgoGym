class Solution:
    def treeDepth(self, left: list[int], right: list[int], root: int) -> int:
        level = [root]
        depth = 0
        while level:
            depth += 1
            nxt = []
            for node in level:
                if left[node] != -1:
                    nxt.append(left[node])
                if right[node] != -1:
                    nxt.append(right[node])
            level = nxt
        return depth
