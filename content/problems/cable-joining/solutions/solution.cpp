#include <functional>
#include <queue>
#include <vector>
using namespace std;

class Solution {
public:
    long long minJoinCost(vector<int>& cables) {
        priority_queue<long long, vector<long long>, greater<long long>> heap(cables.begin(), cables.end());
        long long cost = 0;
        while (heap.size() > 1) {
            long long x = heap.top(); heap.pop();
            long long y = heap.top(); heap.pop();
            cost += x + y;
            heap.push(x + y);
        }
        return cost;
    }
};
