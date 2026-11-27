#include <string>
#include <vector>
using namespace std;

class Solution {
public:
    vector<string> keypadMessages(string digits) {
        vector<string> out;
        if (digits.empty()) return out;
        string buf;
        go(digits, 0, buf, out);
        return out;
    }

private:
    const vector<string> keys = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};

    void go(const string& digits, int i, string& buf, vector<string>& out) {
        if (i == (int)digits.size()) {
            out.push_back(buf);
            return;
        }
        for (char c : keys[digits[i] - '0']) {
            buf.push_back(c);
            go(digits, i + 1, buf, out);
            buf.pop_back();
        }
    }
};
