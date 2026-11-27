#include <vector>
using namespace std;

class Solution {
public:
    bool isMirror(vector<int>& values, vector<int>& left, vector<int>& right, int root) {
        // Two parallel queues hold the pairs (a, b) still to compare.
        vector<int> qa = {left[root]}, qb = {right[root]};
        for (size_t head = 0; head < qa.size(); head++) {
            int a = qa[head], b = qb[head];
            if (a == -1 && b == -1) continue;
            if (a == -1 || b == -1 || values[a] != values[b]) return false;
            qa.push_back(left[a]);
            qb.push_back(right[b]);
            qa.push_back(right[a]);
            qb.push_back(left[b]);
        }
        return true;
    }
};
