#include <algorithm>
#include <vector>
using namespace std;

class Solution {
public:
    long long maxTankArea(vector<int>& heights) {
        int lo = 0, hi = (int)heights.size() - 1;
        long long best = 0;
        while (lo < hi) {
            best = max(best, (long long)(hi - lo) * min(heights[lo], heights[hi]));
            if (heights[lo] <= heights[hi]) lo++;
            else hi--;
        }
        return best;
    }
};
