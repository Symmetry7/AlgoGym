class Solution {
    public int minCapacity(int[] bags, int days) {
        int lo = 0, hi = 0;
        for (int b : bags) {
            lo = Math.max(lo, b);
            hi += b;
        }
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (daysNeeded(bags, mid) <= days) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }

    private int daysNeeded(int[] bags, int cap) {
        int used = 1, load = 0;
        for (int b : bags) {
            if (load + b > cap) {
                used++;
                load = 0;
            }
            load += b;
        }
        return used;
    }
}
