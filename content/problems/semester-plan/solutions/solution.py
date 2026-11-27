class Solution:
    def canFinish(self, courses: int, prerequisites: list[list[int]]) -> bool:
        indegree = [0] * courses
        unlocks = [[] for _ in range(courses)]
        for a, b in prerequisites:
            unlocks[b].append(a)
            indegree[a] += 1
        queue = [c for c in range(courses) if indegree[c] == 0]
        head = 0
        while head < len(queue):
            for nxt in unlocks[queue[head]]:
                indegree[nxt] -= 1
                if indegree[nxt] == 0:
                    queue.append(nxt)
            head += 1
        return len(queue) == courses
