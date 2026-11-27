#include <vector>
using namespace std;

class Solution {
public:
    int fewestHops(int n, vector<vector<int>>& edges, int source, int target) {
        vector<vector<int>> adj(n);
        for (auto& e : edges) {
            adj[e[0]].push_back(e[1]);
            adj[e[1]].push_back(e[0]);
        }
        vector<int> dist(n, -1), queue = {source};
        dist[source] = 0;
        for (size_t head = 0; head < queue.size(); head++) {
            int u = queue[head];
            if (u == target) return dist[u];
            for (int v : adj[u]) {
                if (dist[v] == -1) {
                    dist[v] = dist[u] + 1;
                    queue.push_back(v);
                }
            }
        }
        return -1;
    }
};
