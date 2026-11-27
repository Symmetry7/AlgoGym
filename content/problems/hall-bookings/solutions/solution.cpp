#include <algorithm>
#include <climits>
#include <vector>
using namespace std;

class Solution {
public:
    int maxBookings(vector<vector<int>>& requests) {
        vector<vector<int>> sorted = requests;
        sort(sorted.begin(), sorted.end(), [](const vector<int>& a, const vector<int>& b) { return a[1] < b[1]; });
        long long freeAt = LLONG_MIN;
        int count = 0;
        for (auto& r : sorted) {
            if (r[0] >= freeAt) {
                count++;
                freeAt = r[1];
            }
        }
        return count;
    }
};
