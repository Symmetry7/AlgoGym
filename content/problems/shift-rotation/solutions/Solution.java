class Solution {
    public int[] rotateRight(int[] roster, int k) {
        int n = roster.length;
        int shift = k % n;
        int[] result = new int[n];
        for (int i = 0; i < n; i++) result[(i + shift) % n] = roster[i];
        return result;
    }
}
