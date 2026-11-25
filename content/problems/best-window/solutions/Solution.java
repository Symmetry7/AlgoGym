class Solution {
    public long maxWindowSum(int[] readings, int k) {
        long window = 0;
        for (int i = 0; i < k; i++) window += readings[i];
        long best = window;
        for (int i = k; i < readings.length; i++) {
            window += readings[i] - readings[i - k];
            best = Math.max(best, window);
        }
        return best;
    }
}
