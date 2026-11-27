#include <vector>
using namespace std;

class Solution {
public:
    vector<long long> levelTotals(vector<int>& values, vector<int>& left, vector<int>& right, int root) {
        vector<long long> totals;
        vector<int> level = {root}, next;
        while (!level.empty()) {
            long long sum = 0;
            next.clear();
            for (int node : level) {
                sum += values[node];
                if (left[node] != -1) next.push_back(left[node]);
                if (right[node] != -1) next.push_back(right[node]);
            }
            totals.push_back(sum);
            level.swap(next);
        }
        return totals;
    }
};
