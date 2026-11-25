class Solution {
    public long maxTankArea(int[] heights) {
        int lo = 0, hi = heights.length - 1;
        long best = 0;
        while (lo < hi) {
            best = Math.max(best, (long) (hi - lo) * Math.min(heights[lo], heights[hi]));
            if (heights[lo] <= heights[hi]) lo++;
            else hi--;
        }
        return best;
    }
}
