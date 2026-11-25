import java.util.HashMap;

class Solution {
    public int firstSingleVisit(String[] visitors) {
        HashMap<String, Integer> count = new HashMap<>();
        for (String v : visitors) count.merge(v, 1, Integer::sum);
        for (int i = 0; i < visitors.length; i++) if (count.get(visitors[i]) == 1) return i;
        return -1;
    }
}
