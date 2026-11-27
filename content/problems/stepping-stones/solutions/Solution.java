class Solution {
    public boolean canCross(int[] reach) {
        long farthest = 0;
        for (int i = 0; i < reach.length; i++) {
            if (i > farthest) return false;
            farthest = Math.max(farthest, (long) i + reach[i]);
        }
        return true;
    }
}
