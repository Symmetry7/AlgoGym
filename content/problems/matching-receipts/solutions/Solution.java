import java.util.HashMap;

class Solution {
    public long countPairsWithTotal(int[] amounts, int target) {
        HashMap<Long, Long> seen = new HashMap<>();
        long pairs = 0;
        for (int x : amounts) {
            pairs += seen.getOrDefault((long) target - x, 0L);
            seen.merge((long) x, 1L, Long::sum);
        }
        return pairs;
    }
}
