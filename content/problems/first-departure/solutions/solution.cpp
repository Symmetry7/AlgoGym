#include <vector>
using namespace std;

class Solution {
public:
    int firstDeparture(vector<int>& departures, int arrival) {
        int lo = 0, hi = departures.size();
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (departures[mid] < arrival) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
};
