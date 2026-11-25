#include <algorithm>
#include <string>
#include <unordered_set>
#include <vector>
using namespace std;

class Solution {
public:
    int countAnagramGroups(vector<string>& words) {
        unordered_set<string> keys;
        for (string word : words) {
            sort(word.begin(), word.end());
            keys.insert(word);
        }
        return (int)keys.size();
    }
};
