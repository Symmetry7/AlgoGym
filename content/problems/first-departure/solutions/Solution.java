class Solution {
    public int firstDeparture(int[] departures, int arrival) {
        int lo = 0, hi = departures.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (departures[mid] < arrival) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}
