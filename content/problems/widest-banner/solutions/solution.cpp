#include <algorithm>
#include <vector>
using namespace std;

class Solution {
public:
    long long largestBanner(vector<int>& heights) {
        int n = heights.size();
        vector<int> stack;
        long long best = 0;
        for (int i = 0; i <= n; i++) {
            int h = i == n ? 0 : heights[i];
            while (!stack.empty() && heights[stack.back()] >= h) {
                int top = stack.back();
                stack.pop_back();
                int left = stack.empty() ? -1 : stack.back();
                best = max(best, (long long)heights[top] * (i - left - 1));
            }
            stack.push_back(i);
        }
        return best;
    }
};
