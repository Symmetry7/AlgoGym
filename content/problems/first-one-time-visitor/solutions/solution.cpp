#include <string>
#include <unordered_map>
#include <vector>
using namespace std;

class Solution {
public:
    int firstSingleVisit(vector<string>& visitors) {
        unordered_map<string, int> count;
        for (const string& v : visitors) count[v]++;
        for (int i = 0; i < (int)visitors.size(); i++) if (count[visitors[i]] == 1) return i;
        return -1;
    }
};
