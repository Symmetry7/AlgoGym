import java.util.HashMap;

class Solution {
    public long countTargetStretches(int[] changes, int target) {
        HashMap<Long, Long> seen = new HashMap<>();
        seen.put(0L, 1L);
        long total = 0, count = 0;
        for (int c : changes) {
            total += c;
            count += seen.getOrDefault(total - target, 0L);
            seen.merge(total, 1L, Long::sum);
        }
        return count;
    }
}
