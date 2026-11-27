#include <algorithm>
using namespace std;

class Solution {
public:
    long long largestSide(long long area) {
        long long lo = 0, hi = min(area, 31622777LL);
        while (lo < hi) {
            long long mid = (lo + hi + 1) / 2;
            if (mid * mid <= area) lo = mid;
            else hi = mid - 1;
        }
        return lo;
    }
};
