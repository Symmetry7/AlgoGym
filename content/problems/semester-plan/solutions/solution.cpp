#include <vector>
using namespace std;

class Solution {
public:
    bool canFinish(int courses, vector<vector<int>>& prerequisites) {
        vector<int> indegree(courses, 0), queue;
        vector<vector<int>> unlocks(courses);
        for (auto& p : prerequisites) {
            unlocks[p[1]].push_back(p[0]);
            indegree[p[0]]++;
        }
        for (int c = 0; c < courses; c++) if (indegree[c] == 0) queue.push_back(c);
        for (size_t head = 0; head < queue.size(); head++) {
            for (int next : unlocks[queue[head]]) {
                if (--indegree[next] == 0) queue.push_back(next);
            }
        }
        return (int)queue.size() == courses;
    }
};
