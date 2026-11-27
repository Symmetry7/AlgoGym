#include <vector>
using namespace std;

class Solution {
public:
    vector<int> reverseRelay(vector<int>& values, vector<int>& next, int head) {
        vector<int> link = next;
        int prev = -1, cur = head;
        while (cur != -1) {
            int ahead = link[cur];
            link[cur] = prev;
            prev = cur;
            cur = ahead;
        }
        vector<int> order;
        for (int node = prev; node != -1; node = link[node]) order.push_back(values[node]);
        return order;
    }
};
