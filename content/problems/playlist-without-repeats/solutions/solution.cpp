#include <algorithm>
#include <unordered_map>
#include <vector>
using namespace std;

class Solution {
public:
    int longestUniqueStretch(vector<int>& songs) {
        unordered_map<int, int> last;
        last.reserve(songs.size() * 2);
        int left = 0, best = 0;
        for (int right = 0; right < (int)songs.size(); right++) {
            auto it = last.find(songs[right]);
            if (it != last.end() && it->second >= left) left = it->second + 1;
            last[songs[right]] = right;
            best = max(best, right - left + 1);
        }
        return best;
    }
};
