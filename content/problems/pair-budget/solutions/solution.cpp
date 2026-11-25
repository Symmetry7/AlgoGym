#include <vector>
using namespace std;

class Solution {
public:
    long long countAffordablePairs(vector<int>& prices, int budget) {
        int lo = 0, hi = (int)prices.size() - 1;
        long long pairs = 0;
        while (lo < hi) {
            if ((long long)prices[lo] + prices[hi] <= budget) {
                pairs += hi - lo;
                lo++;
            } else {
                hi--;
            }
        }
        return pairs;
    }
};
