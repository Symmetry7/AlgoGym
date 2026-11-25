#include <cctype>
#include <string>
using namespace std;

class Solution {
public:
    bool isNoisyPalindrome(string text) {
        int lo = 0, hi = (int)text.size() - 1;
        while (lo < hi) {
            if (!isalnum((unsigned char)text[lo])) lo++;
            else if (!isalnum((unsigned char)text[hi])) hi--;
            else if (tolower((unsigned char)text[lo]) != tolower((unsigned char)text[hi])) return false;
            else {
                lo++;
                hi--;
            }
        }
        return true;
    }
};
