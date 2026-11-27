#include <algorithm>
#include <functional>
#include <queue>
#include <vector>
using namespace std;

class Solution {
public:
    vector<int> topScores(vector<int>& scores, int k) {
        priority_queue<int, vector<int>, greater<int>> heap;
        for (int s : scores) {
            if ((int)heap.size() < k) heap.push(s);
            else if (s > heap.top()) {
                heap.pop();
                heap.push(s);
            }
        }
        vector<int> out;
        while (!heap.empty()) {
            out.push_back(heap.top());
            heap.pop();
        }
        reverse(out.begin(), out.end());
        return out;
    }
};
