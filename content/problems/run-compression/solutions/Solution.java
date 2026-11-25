class Solution {
    public String compressRuns(String signal) {
        StringBuilder out = new StringBuilder();
        int start = 0;
        for (int i = 1; i <= signal.length(); i++) {
            if (i == signal.length() || signal.charAt(i) != signal.charAt(start)) {
                out.append(signal.charAt(start)).append(i - start);
                start = i;
            }
        }
        return out.toString();
    }
}
