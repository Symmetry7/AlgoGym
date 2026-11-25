#include <algorithm>
#include <numeric>
#include <vector>
using namespace std;

class Solution {
public:
    long long minDailyLoad(vector<int>& pages, int days) {
        auto fits = [&](long long limit) {
            int used = 1;
            long long today = 0;
            for (int p : pages) {
                if (today + p > limit) {
                    used++;
                    today = 0;
                }
                today += p;
            }
            return used <= days;
        };
        long long lo = *max_element(pages.begin(), pages.end());
        long long hi = accumulate(pages.begin(), pages.end(), 0LL);
        while (lo < hi) {
            long long mid = lo + (hi - lo) / 2;
            if (fits(mid)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};
