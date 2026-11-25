import java.util.HashMap;

class Solution {
    public int longestUniqueStretch(int[] songs) {
        HashMap<Integer, Integer> last = new HashMap<>();
        int left = 0, best = 0;
        for (int right = 0; right < songs.length; right++) {
            Integer seenAt = last.get(songs[right]);
            if (seenAt != null && seenAt >= left) left = seenAt + 1;
            last.put(songs[right], right);
            best = Math.max(best, right - left + 1);
        }
        return best;
    }
}
