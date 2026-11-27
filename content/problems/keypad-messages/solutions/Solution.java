import java.util.ArrayList;
import java.util.List;

class Solution {
    private static final String[] KEYS = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};

    public String[] keypadMessages(String digits) {
        List<String> out = new ArrayList<>();
        if (!digits.isEmpty()) go(digits, 0, new StringBuilder(), out);
        return out.toArray(new String[0]);
    }

    private void go(String digits, int i, StringBuilder buf, List<String> out) {
        if (i == digits.length()) {
            out.add(buf.toString());
            return;
        }
        for (char c : KEYS[digits.charAt(i) - '0'].toCharArray()) {
            buf.append(c);
            go(digits, i + 1, buf, out);
            buf.deleteCharAt(buf.length() - 1);
        }
    }
}
