import java.util.ArrayDeque;
import java.util.Arrays;

class Solution {
    public int[] nextHigherPriceDay(int[] prices) {
        int[] answer = new int[prices.length];
        Arrays.fill(answer, -1);
        ArrayDeque<Integer> waiting = new ArrayDeque<>();
        for (int i = 0; i < prices.length; i++) {
            while (!waiting.isEmpty() && prices[waiting.peek()] < prices[i]) {
                answer[waiting.pop()] = i;
            }
            waiting.push(i);
        }
        return answer;
    }
}
