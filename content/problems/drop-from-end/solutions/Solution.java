class Solution {
    public int[] dropFromEnd(int[] values, int[] next, int head, int k) {
        int[] link = next.clone();
        int lead = head;
        for (int i = 0; i < k; i++) lead = link[lead];
        int start = head;
        if (lead == -1) {
            start = link[head];
        } else {
            int trail = head;
            while (link[lead] != -1) {
                lead = link[lead];
                trail = link[trail];
            }
            link[trail] = link[link[trail]];
        }
        int[] out = new int[values.length - 1];
        int i = 0;
        for (int node = start; node != -1; node = link[node]) out[i++] = values[node];
        return out;
    }
}
