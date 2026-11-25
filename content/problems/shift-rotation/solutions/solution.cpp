#include <vector>
using namespace std;

class Solution {
public:
    vector<int> rotateRight(vector<int>& roster, int k) {
        int n = roster.size();
        int shift = k % n;
        vector<int> result(n);
        for (int i = 0; i < n; i++) result[(i + shift) % n] = roster[i];
        return result;
    }
};
