#include <algorithm>
#include <vector>
using namespace std;

class Solution {
public:
    vector<int> countOpenedBy(vector<int>& times, vector<int>& queries) {
        vector<int> counts;
        counts.reserve(queries.size());
        for (int q : queries) {
            counts.push_back((int)(upper_bound(times.begin(), times.end(), q) - times.begin()));
        }
        return counts;
    }
};
