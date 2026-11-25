class Solution {
    public int shortestWindowAtLeast(int[] donations, int goal) {
        int left = 0, best = 0;
        long total = 0;
        for (int right = 0; right < donations.length; right++) {
            total += donations[right];
            while (total >= goal) {
                int length = right - left + 1;
                if (best == 0 || length < best) best = length;
                total -= donations[left++];
            }
        }
        return best;
    }
}
