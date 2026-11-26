import java.util.ArrayList;
import java.util.List;

class Solution {
    public String[] bracketLayouts(int pairs, int maxDepth) {
        List<String> out = new ArrayList<>();
        go(pairs, maxDepth, 0, 0, new StringBuilder(), out);
        return out.toArray(new String[0]);
    }

    private void go(int pairs, int maxDepth, int open, int close, StringBuilder buf, List<String> out) {
        if (buf.length() == 2 * pairs) {
            out.add(buf.toString());
            return;
        }
        if (open < pairs && open - close < maxDepth) {
            buf.append('(');
            go(pairs, maxDepth, open + 1, close, buf, out);
            buf.deleteCharAt(buf.length() - 1);
        }
        if (close < open) {
            buf.append(')');
            go(pairs, maxDepth, open, close + 1, buf, out);
            buf.deleteCharAt(buf.length() - 1);
        }
    }
}
