class Solution {
    public int loopStart(int[] next, int head) {
        int slow = head, fast = head;
        while (fast != -1 && next[fast] != -1) {
            slow = next[slow];
            fast = next[next[fast]];
            if (slow == fast) {
                int p = head;
                while (p != slow) {
                    p = next[p];
                    slow = next[slow];
                }
                return p;
            }
        }
        return -1;
    }
}
