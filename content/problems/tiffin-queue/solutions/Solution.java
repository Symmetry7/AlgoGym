class Solution {
    public int unserved(int[] students, int[] tiffins) {
        int[] want = new int[2];
        for (int s : students) want[s]++;
        for (int t : tiffins) {
            if (want[t] == 0) break;
            want[t]--;
        }
        return want[0] + want[1];
    }
}
