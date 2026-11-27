#include <algorithm>
#include <vector>
using namespace std;

class Solution {
public:
    bool canCross(vector<int>& reach) {
        long long farthest = 0;
        for (int i = 0; i < (int)reach.size(); i++) {
            if (i > farthest) return false;
            farthest = max(farthest, (long long)i + reach[i]);
        }
        return true;
    }
};
