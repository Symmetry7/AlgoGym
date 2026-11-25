class Solution {
    public long minDailyLoad(int[] pages, int days) {
        long lo = 0, hi = 0;
        for (int p : pages) {
            lo = Math.max(lo, p);
            hi += p;
        }
        while (lo < hi) {
            long mid = lo + (hi - lo) / 2;
            if (fits(pages, days, mid)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }

    private boolean fits(int[] pages, int days, long limit) {
        int used = 1;
        long today = 0;
        for (int p : pages) {
            if (today + p > limit) {
                used++;
                today = 0;
            }
            today += p;
        }
        return used <= days;
    }
}
