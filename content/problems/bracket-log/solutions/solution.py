class Solution:
    def isBalanced(self, log: str) -> bool:
        partner = {")": "(", "]": "[", "}": "{"}
        stack = []
        for c in log:
            if c in "([{":
                stack.append(c)
            elif not stack or stack.pop() != partner[c]:
                return False
        return not stack
