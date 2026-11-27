#include <string>
#include <vector>
using namespace std;

class Solution {
public:
    vector<vector<string>> allPicks(vector<string>& items) {
        vector<vector<string>> out;
        vector<string> cur;
        go(items, 0, cur, out);
        return out;
    }

private:
    void go(const vector<string>& items, int i, vector<string>& cur, vector<vector<string>>& out) {
        if (i == (int)items.size()) {
            out.push_back(cur);
            return;
        }
        go(items, i + 1, cur, out);
        cur.push_back(items[i]);
        go(items, i + 1, cur, out);
        cur.pop_back();
    }
};
