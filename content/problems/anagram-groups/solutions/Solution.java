import java.util.Arrays;
import java.util.HashSet;

class Solution {
    public int countAnagramGroups(String[] words) {
        HashSet<String> keys = new HashSet<>();
        for (String word : words) {
            char[] letters = word.toCharArray();
            Arrays.sort(letters);
            keys.add(new String(letters));
        }
        return keys.size();
    }
}
