import java.util.HashMap;

class Solution {
    public long countSharedBadgePairs(String[] badges) {
        HashMap<String, Long> seen = new HashMap<>();
        long pairs = 0;
        for (String code : badges) {
            long earlier = seen.getOrDefault(code, 0L);
            pairs += earlier;
            seen.put(code, earlier + 1);
        }
        return pairs;
    }
}
