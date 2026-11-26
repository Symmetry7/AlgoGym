class Solution {
    public long largestBanner(int[] heights) {
        int n = heights.length;
        int[] stack = new int[n + 1];
        int top = 0;
        long best = 0;
        for (int i = 0; i <= n; i++) {
            int h = i == n ? 0 : heights[i];
            while (top > 0 && heights[stack[top - 1]] >= h) {
                int j = stack[--top];
                int left = top > 0 ? stack[top - 1] : -1;
                best = Math.max(best, (long) heights[j] * (i - left - 1));
            }
            stack[top++] = i;
        }
        return best;
    }
}
