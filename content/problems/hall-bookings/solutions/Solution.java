import java.util.Arrays;

class Solution {
    public int maxBookings(int[][] requests) {
        int[][] sorted = requests.clone();
        Arrays.sort(sorted, (a, b) -> Integer.compare(a[1], b[1]));
        long free = Long.MIN_VALUE;
        int count = 0;
        for (int[] r : sorted) {
            if (r[0] >= free) {
                count++;
                free = r[1];
            }
        }
        return count;
    }
}
