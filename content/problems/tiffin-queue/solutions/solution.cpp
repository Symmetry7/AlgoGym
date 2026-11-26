#include <vector>
using namespace std;

class Solution {
public:
    int unserved(vector<int>& students, vector<int>& tiffins) {
        int want[2] = {0, 0};
        for (int s : students) want[s]++;
        for (int t : tiffins) {
            if (want[t] == 0) break;
            want[t]--;
        }
        return want[0] + want[1];
    }
};
