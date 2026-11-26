class Solution:
    def loopStart(self, next: list[int], head: int) -> int:
        slow = fast = head
        while fast != -1 and next[fast] != -1:
            slow = next[slow]
            fast = next[next[fast]]
            if slow == fast:
                p = head
                while p != slow:
                    p = next[p]
                    slow = next[slow]
                return p
        return -1
