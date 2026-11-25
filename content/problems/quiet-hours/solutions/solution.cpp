#include <algorithm>
#include <vector>
using namespace std;

class Solution {
public:
    int longestQuietRun(vector<int>& levels, int limit) {
        int best = 0, current = 0;
        for (int level : levels) {
            current = level <= limit ? current + 1 : 0;
            best = max(best, current);
        }
        return best;
    }
};
