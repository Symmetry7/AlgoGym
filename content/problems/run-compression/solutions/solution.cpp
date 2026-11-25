#include <string>
using namespace std;

class Solution {
public:
    string compressRuns(string signal) {
        string out;
        size_t start = 0;
        for (size_t i = 1; i <= signal.size(); i++) {
            if (i == signal.size() || signal[i] != signal[start]) {
                out += signal[start];
                out += to_string(i - start);
                start = i;
            }
        }
        return out;
    }
};
