import java.util.ArrayList;
import java.util.List;

class Solution {
    public int treeDepth(int[] left, int[] right, int root) {
        List<Integer> level = new ArrayList<>();
        level.add(root);
        int depth = 0;
        while (!level.isEmpty()) {
            depth++;
            List<Integer> next = new ArrayList<>();
            for (int node : level) {
                if (left[node] != -1) next.add(left[node]);
                if (right[node] != -1) next.add(right[node]);
            }
            level = next;
        }
        return depth;
    }
}
