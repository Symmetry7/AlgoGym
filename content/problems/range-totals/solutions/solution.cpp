#include <vector>
using namespace std;

class Solution {
public:
    vector<long long> rangeTotals(vector<int>& values, vector<int>& lefts, vector<int>& rights) {
        vector<long long> prefix(values.size() + 1, 0);
        for (size_t i = 0; i < values.size(); i++) prefix[i + 1] = prefix[i] + values[i];
        vector<long long> answers(lefts.size());
        for (size_t j = 0; j < lefts.size(); j++) answers[j] = prefix[rights[j] + 1] - prefix[lefts[j]];
        return answers;
    }
};
