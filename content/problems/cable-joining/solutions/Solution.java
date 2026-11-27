import java.util.PriorityQueue;

class Solution {
    public long minJoinCost(int[] cables) {
        PriorityQueue<Long> heap = new PriorityQueue<>();
        for (int c : cables) heap.add((long) c);
        long cost = 0;
        while (heap.size() > 1) {
            long joined = heap.poll() + heap.poll();
            cost += joined;
            heap.add(joined);
        }
        return cost;
    }
}
