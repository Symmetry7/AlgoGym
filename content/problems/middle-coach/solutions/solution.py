class Solution:
    def middleCoach(self, values: list[int], next: list[int], head: int) -> int:
        slow = fast = head
        while fast != -1 and next[fast] != -1:
            slow = next[slow]
            fast = next[next[fast]]
        return values[slow]
