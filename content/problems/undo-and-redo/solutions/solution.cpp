#include <string>
#include <vector>
using namespace std;

class Solution {
public:
    string finalDocument(vector<string>& actions) {
        vector<string> document, redo;
        for (const string& action : actions) {
            if (action == "<") {
                if (!document.empty()) {
                    redo.push_back(document.back());
                    document.pop_back();
                }
            } else if (action == ">") {
                if (!redo.empty()) {
                    document.push_back(redo.back());
                    redo.pop_back();
                }
            } else {
                document.push_back(action);
                redo.clear();
            }
        }
        string result;
        for (size_t i = 0; i < document.size(); i++) {
            if (i) result += ' ';
            result += document[i];
        }
        return result;
    }
};
