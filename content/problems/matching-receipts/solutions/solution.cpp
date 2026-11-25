#include <unordered_map>
#include <vector>
using namespace std;

class Solution {
public:
    long long countPairsWithTotal(vector<int>& amounts, int target) {
        unordered_map<long long, long long> seen;
        seen.reserve(amounts.size() * 2);
        long long pairs = 0;
        for (int x : amounts) {
            auto it = seen.find((long long)target - x);
            if (it != seen.end()) pairs += it->second;
            seen[x]++;
        }
        return pairs;
    }
};
