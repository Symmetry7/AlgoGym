class Solution:
    def daysToWarmer(self, temps: list[int]) -> list[int]:
        answer = [0] * len(temps)
        stack = []
        for i, t in enumerate(temps):
            while stack and temps[stack[-1]] < t:
                j = stack.pop()
                answer[j] = i - j
            stack.append(i)
        return answer
