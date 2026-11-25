class Solution {
    public long countAffordablePairs(int[] prices, int budget) {
        int lo = 0, hi = prices.length - 1;
        long pairs = 0;
        while (lo < hi) {
            if ((long) prices[lo] + prices[hi] <= budget) {
                pairs += hi - lo;
                lo++;
            } else {
                hi--;
            }
        }
        return pairs;
    }
}
