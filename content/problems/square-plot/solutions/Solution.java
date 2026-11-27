class Solution {
    public long largestSide(long area) {
        long lo = 0, hi = Math.min(area, 31622777L);
        while (lo < hi) {
            long mid = (lo + hi + 1) / 2;
            if (mid * mid <= area) lo = mid;
            else hi = mid - 1;
        }
        return lo;
    }
}
