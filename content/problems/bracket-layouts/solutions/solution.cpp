#include <string>
#include <vector>
using namespace std;

class Solution {
public:
    vector<string> bracketLayouts(int pairs, int maxDepth) {
        vector<string> out;
        string buf;
        go(pairs, maxDepth, 0, 0, buf, out);
        return out;
    }

private:
    void go(int pairs, int maxDepth, int open, int close, string& buf, vector<string>& out) {
        if ((int)buf.size() == 2 * pairs) {
            out.push_back(buf);
            return;
        }
        if (open < pairs && open - close < maxDepth) {
            buf.push_back('(');
            go(pairs, maxDepth, open + 1, close, buf, out);
            buf.pop_back();
        }
        if (close < open) {
            buf.push_back(')');
            go(pairs, maxDepth, open, close + 1, buf, out);
            buf.pop_back();
        }
    }
};
