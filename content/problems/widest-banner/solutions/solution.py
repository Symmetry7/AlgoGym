class Solution:
    def largestBanner(self, heights: list[int]) -> int:
        n = len(heights)
        stack = []
        best = 0
        for i in range(n + 1):
            h = 0 if i == n else heights[i]
            while stack and heights[stack[-1]] >= h:
                top = stack.pop()
                left = stack[-1] if stack else -1
                best = max(best, heights[top] * (i - left - 1))
            stack.append(i)
        return best
