#include <vector>
using namespace std;

class Solution {
public:
    vector<int> dropFromEnd(vector<int>& values, vector<int>& next, int head, int k) {
        vector<int> link = next;
        int lead = head;
        for (int i = 0; i < k; i++) lead = link[lead];
        int start = head;
        if (lead == -1) {
            start = link[head];
        } else {
            int trail = head;
            while (link[lead] != -1) {
                lead = link[lead];
                trail = link[trail];
            }
            link[trail] = link[link[trail]];
        }
        vector<int> out;
        for (int node = start; node != -1; node = link[node]) out.push_back(values[node]);
        return out;
    }
};
