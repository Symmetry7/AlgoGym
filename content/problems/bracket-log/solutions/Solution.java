class Solution {
    public boolean isBalanced(String log) {
        char[] stack = new char[log.length()];
        int top = 0;
        for (int i = 0; i < log.length(); i++) {
            char c = log.charAt(i);
            if (c == '(' || c == '[' || c == '{') {
                stack[top++] = c;
                continue;
            }
            char want = c == ')' ? '(' : c == ']' ? '[' : '{';
            if (top == 0 || stack[top - 1] != want) return false;
            top--;
        }
        return top == 0;
    }
}
