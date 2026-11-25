class Solution {
    public int[] countOpenedBy(int[] times, int[] queries) {
        int[] counts = new int[queries.length];
        for (int j = 0; j < queries.length; j++) {
            int lo = 0, hi = times.length;
            while (lo < hi) {
                int mid = (lo + hi) >>> 1;
                if (times[mid] <= queries[j]) lo = mid + 1;
                else hi = mid;
            }
            counts[j] = lo;
        }
        return counts;
    }
}
