#include <algorithm>
#include <vector>
using namespace std;

class Solution {
public:
    long long maxWindowSum(vector<int>& readings, int k) {
        long long window = 0;
        for (int i = 0; i < k; i++) window += readings[i];
        long long best = window;
        for (int i = k; i < (int)readings.size(); i++) {
            window += readings[i] - readings[i - k];
            best = max(best, window);
        }
        return best;
    }
};
