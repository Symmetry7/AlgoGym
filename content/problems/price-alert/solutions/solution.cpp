#include <vector>
using namespace std;

class Solution {
public:
    vector<int> nextHigherPriceDay(vector<int>& prices) {
        vector<int> answer(prices.size(), -1);
        vector<int> waiting;
        for (int i = 0; i < (int)prices.size(); i++) {
            while (!waiting.empty() && prices[waiting.back()] < prices[i]) {
                answer[waiting.back()] = i;
                waiting.pop_back();
            }
            waiting.push_back(i);
        }
        return answer;
    }
};
