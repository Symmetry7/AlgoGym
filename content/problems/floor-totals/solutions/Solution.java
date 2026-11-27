import java.util.ArrayList;
import java.util.List;

class Solution {
    public long[] levelTotals(int[] values, int[] left, int[] right, int root) {
        List<Long> totals = new ArrayList<>();
        int[] level = {root};
        int size = 1;
        int[] next = new int[values.length];
        while (size > 0) {
            long sum = 0;
            int nextSize = 0;
            for (int i = 0; i < size; i++) {
                int node = level[i];
                sum += values[node];
                if (left[node] != -1) next[nextSize++] = left[node];
                if (right[node] != -1) next[nextSize++] = right[node];
            }
            totals.add(sum);
            level = java.util.Arrays.copyOf(next, nextSize);
            size = nextSize;
        }
        long[] out = new long[totals.size()];
        for (int i = 0; i < out.length; i++) out[i] = totals.get(i);
        return out;
    }
}
