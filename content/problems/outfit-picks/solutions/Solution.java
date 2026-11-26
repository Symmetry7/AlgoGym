import java.util.ArrayList;
import java.util.List;

class Solution {
    public String[][] allPicks(String[] items) {
        List<String[]> out = new ArrayList<>();
        go(items, 0, new ArrayList<>(), out);
        return out.toArray(new String[0][]);
    }

    private void go(String[] items, int i, List<String> cur, List<String[]> out) {
        if (i == items.length) {
            out.add(cur.toArray(new String[0]));
            return;
        }
        go(items, i + 1, cur, out);
        cur.add(items[i]);
        go(items, i + 1, cur, out);
        cur.remove(cur.size() - 1);
    }
}
