#include <vector>
using namespace std;

class Solution {
public:
    vector<int> daysToWarmer(vector<int>& temps) {
        vector<int> answer(temps.size(), 0), stack;
        for (int i = 0; i < (int)temps.size(); i++) {
            while (!stack.empty() && temps[stack.back()] < temps[i]) {
                answer[stack.back()] = i - stack.back();
                stack.pop_back();
            }
            stack.push_back(i);
        }
        return answer;
    }
};
