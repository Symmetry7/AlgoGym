class Solution {
    public int findTrain(int[] trains, int target) {
        int lo = 0, hi = trains.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (trains[mid] == target) return mid;
            if (trains[lo] <= trains[mid]) {
                if (trains[lo] <= target && target < trains[mid]) hi = mid - 1;
                else lo = mid + 1;
            } else {
                if (trains[mid] < target && target <= trains[hi]) lo = mid + 1;
                else hi = mid - 1;
            }
        }
        return -1;
    }
}
