#include <string>
#include <vector>
using namespace std;

class Solution {
public:
    bool isBalanced(string log) {
        vector<char> stack;
        for (char c : log) {
            if (c == '(' || c == '[' || c == '{') {
                stack.push_back(c);
                continue;
            }
            char want = c == ')' ? '(' : c == ']' ? '[' : '{';
            if (stack.empty() || stack.back() != want) return false;
            stack.pop_back();
        }
        return stack.empty();
    }
};
