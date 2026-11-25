class Solution:
    def rotateRight(self, roster: list[int], k: int) -> list[int]:
        shift = k % len(roster)
        return roster[-shift:] + roster[:-shift] if shift else roster[:]
