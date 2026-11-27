class Solution {
    public boolean isMirror(int[] values, int[] left, int[] right, int root) {
        int n = values.length;
        int[] qa = new int[n + 2], qb = new int[n + 2];
        int head = 0, tail = 0;
        qa[tail] = left[root]; qb[tail] = right[root]; tail++;
        while (head < tail) {
            int a = qa[head], b = qb[head];
            head++;
            if (a == -1 && b == -1) continue;
            if (a == -1 || b == -1 || values[a] != values[b]) return false;
            qa[tail] = left[a]; qb[tail] = right[b]; tail++;
            qa[tail] = right[a]; qb[tail] = left[b]; tail++;
        }
        return true;
    }
}
