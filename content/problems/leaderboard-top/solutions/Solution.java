import java.util.PriorityQueue;

class Solution {
    public int[] topScores(int[] scores, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int s : scores) {
            if (heap.size() < k) heap.add(s);
            else if (s > heap.peek()) {
                heap.poll();
                heap.add(s);
            }
        }
        int[] out = new int[k];
        for (int i = k - 1; i >= 0; i--) out[i] = heap.poll();
        return out;
    }
}
