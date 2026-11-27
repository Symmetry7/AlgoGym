class Solution {
    public int[] reverseRelay(int[] values, int[] next, int head) {
        int[] link = next.clone();
        int prev = -1, cur = head;
        while (cur != -1) {
            int ahead = link[cur];
            link[cur] = prev;
            prev = cur;
            cur = ahead;
        }
        int[] order = new int[values.length];
        int k = 0;
        for (int node = prev; node != -1; node = link[node]) order[k++] = values[node];
        return order;
    }
}
