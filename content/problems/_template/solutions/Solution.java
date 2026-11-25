class Solution {
    public int longestQuietRun(int[] levels, int limit) {
        int best = 0, current = 0;
        for (int level : levels) {
            current = level <= limit ? current + 1 : 0;
            best = Math.max(best, current);
        }
        return best;
    }
}
