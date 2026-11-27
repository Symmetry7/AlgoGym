from collections import deque


class Solution:
    def countIslands(self, grid: list[str]) -> int:
        rows, cols = len(grid), len(grid[0])
        seen = [[False] * cols for _ in range(rows)]
        islands = 0
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] != "#" or seen[r][c]:
                    continue
                islands += 1
                seen[r][c] = True
                queue = deque([(r, c)])
                while queue:
                    cr, cc = queue.popleft()
                    for nr, nc in ((cr + 1, cc), (cr - 1, cc), (cr, cc + 1), (cr, cc - 1)):
                        if 0 <= nr < rows and 0 <= nc < cols and not seen[nr][nc] and grid[nr][nc] == "#":
                            seen[nr][nc] = True
                            queue.append((nr, nc))
        return islands
