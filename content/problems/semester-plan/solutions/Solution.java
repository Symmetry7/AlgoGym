import java.util.ArrayList;
import java.util.List;

class Solution {
    public boolean canFinish(int courses, int[][] prerequisites) {
        int[] indegree = new int[courses];
        List<List<Integer>> unlocks = new ArrayList<>();
        for (int i = 0; i < courses; i++) unlocks.add(new ArrayList<>());
        for (int[] p : prerequisites) {
            unlocks.get(p[1]).add(p[0]);
            indegree[p[0]]++;
        }
        int[] queue = new int[courses];
        int head = 0, tail = 0;
        for (int c = 0; c < courses; c++) if (indegree[c] == 0) queue[tail++] = c;
        while (head < tail) {
            for (int next : unlocks.get(queue[head++])) {
                if (--indegree[next] == 0) queue[tail++] = next;
            }
        }
        return tail == courses;
    }
}
