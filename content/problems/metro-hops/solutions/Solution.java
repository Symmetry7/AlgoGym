import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class Solution {
    public int fewestHops(int n, int[][] edges, int source, int target) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]);
            adj.get(e[1]).add(e[0]);
        }
        int[] dist = new int[n];
        Arrays.fill(dist, -1);
        dist[source] = 0;
        int[] queue = new int[n];
        int head = 0, tail = 0;
        queue[tail++] = source;
        while (head < tail) {
            int u = queue[head++];
            if (u == target) return dist[u];
            for (int v : adj.get(u)) {
                if (dist[v] == -1) {
                    dist[v] = dist[u] + 1;
                    queue[tail++] = v;
                }
            }
        }
        return -1;
    }
}
