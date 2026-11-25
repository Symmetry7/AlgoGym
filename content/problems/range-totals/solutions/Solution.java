class Solution {
    public long[] rangeTotals(int[] values, int[] lefts, int[] rights) {
        long[] prefix = new long[values.length + 1];
        for (int i = 0; i < values.length; i++) prefix[i + 1] = prefix[i] + values[i];
        long[] answers = new long[lefts.length];
        for (int j = 0; j < lefts.length; j++) answers[j] = prefix[rights[j] + 1] - prefix[lefts[j]];
        return answers;
    }
}
