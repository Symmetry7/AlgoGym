class Solution {
    public int countIslands(String[] grid) {
        int rows = grid.length, cols = grid[0].length(), islands = 0;
        boolean[] seen = new boolean[rows * cols];
        int[] queue = new int[rows * cols];
        int[] dr = {1, -1, 0, 0}, dc = {0, 0, 1, -1};
        for (int start = 0; start < rows * cols; start++) {
            if (seen[start] || grid[start / cols].charAt(start % cols) != '#') continue;
            islands++;
            seen[start] = true;
            int head = 0, tail = 0;
            queue[tail++] = start;
            while (head < tail) {
                int cell = queue[head++], r = cell / cols, c = cell % cols;
                for (int k = 0; k < 4; k++) {
                    int nr = r + dr[k], nc = c + dc[k];
                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
                    int next = nr * cols + nc;
                    if (!seen[next] && grid[nr].charAt(nc) == '#') {
                        seen[next] = true;
                        queue[tail++] = next;
                    }
                }
            }
        }
        return islands;
    }
}
