#include <vector>
using namespace std;

class Solution {
public:
    vector<int> mergeSorted(vector<int>& left, vector<int>& right) {
        vector<int> out;
        out.reserve(left.size() + right.size());
        size_t i = 0, j = 0;
        while (i < left.size() && j < right.size()) out.push_back(left[i] <= right[j] ? left[i++] : right[j++]);
        while (i < left.size()) out.push_back(left[i++]);
        while (j < right.size()) out.push_back(right[j++]);
        return out;
    }
};
