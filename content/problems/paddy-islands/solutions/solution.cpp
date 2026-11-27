#include <string>
#include <vector>
using namespace std;

class Solution {
public:
    int countIslands(vector<string>& grid) {
        int rows = grid.size(), cols = grid[0].size(), islands = 0;
        vector<char> seen(rows * cols, 0);
        vector<int> queue(rows * cols);
        const int dr[4] = {1, -1, 0, 0}, dc[4] = {0, 0, 1, -1};
        for (int start = 0; start < rows * cols; start++) {
            if (seen[start] || grid[start / cols][start % cols] != '#') continue;
            islands++;
            seen[start] = 1;
            int head = 0, tail = 0;
            queue[tail++] = start;
            while (head < tail) {
                int cell = queue[head++], r = cell / cols, c = cell % cols;
                for (int k = 0; k < 4; k++) {
                    int nr = r + dr[k], nc = c + dc[k];
                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
                    int next = nr * cols + nc;
                    if (!seen[next] && grid[nr][nc] == '#') {
                        seen[next] = 1;
                        queue[tail++] = next;
                    }
                }
            }
        }
        return islands;
    }
};
