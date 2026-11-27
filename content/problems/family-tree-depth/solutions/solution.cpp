#include <vector>
using namespace std;

class Solution {
public:
    int treeDepth(vector<int>& left, vector<int>& right, int root) {
        vector<int> level = {root}, next;
        int depth = 0;
        while (!level.empty()) {
            depth++;
            next.clear();
            for (int node : level) {
                if (left[node] != -1) next.push_back(left[node]);
                if (right[node] != -1) next.push_back(right[node]);
            }
            level.swap(next);
        }
        return depth;
    }
};
