#include <string>
#include <unordered_map>
#include <vector>
using namespace std;

class Solution {
public:
    long long countSharedBadgePairs(vector<string>& badges) {
        unordered_map<string, long long> seen;
        long long pairs = 0;
        for (const string& code : badges) {
            long long& earlier = seen[code];
            pairs += earlier;
            earlier++;
        }
        return pairs;
    }
};
