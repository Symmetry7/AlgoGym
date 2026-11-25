class Solution {
    public boolean isNoisyPalindrome(String text) {
        int lo = 0, hi = text.length() - 1;
        while (lo < hi) {
            char a = text.charAt(lo), b = text.charAt(hi);
            if (!Character.isLetterOrDigit(a)) lo++;
            else if (!Character.isLetterOrDigit(b)) hi--;
            else if (Character.toLowerCase(a) != Character.toLowerCase(b)) return false;
            else {
                lo++;
                hi--;
            }
        }
        return true;
    }
}
