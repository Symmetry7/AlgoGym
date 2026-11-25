#include <unordered_map>
#include <vector>
using namespace std;

class Solution {
public:
    long long countTargetStretches(vector<int>& changes, int target) {
        unordered_map<long long, long long> seen;
        seen.reserve(changes.size() * 2);
        seen[0] = 1;
        long long total = 0, count = 0;
        for (int c : changes) {
            total += c;
            auto it = seen.find(total - target);
            if (it != seen.end()) count += it->second;
            seen[total]++;
        }
        return count;
    }
};
