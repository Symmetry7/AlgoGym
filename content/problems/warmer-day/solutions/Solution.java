class Solution {
    public int[] daysToWarmer(int[] temps) {
        int[] answer = new int[temps.length];
        int[] stack = new int[temps.length];
        int top = 0;
        for (int i = 0; i < temps.length; i++) {
            while (top > 0 && temps[stack[top - 1]] < temps[i]) {
                int j = stack[--top];
                answer[j] = i - j;
            }
            stack[top++] = i;
        }
        return answer;
    }
}
