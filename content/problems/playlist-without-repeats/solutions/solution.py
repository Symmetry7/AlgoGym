class Solution:
    def longestUniqueStretch(self, songs: list[int]) -> int:
        last: dict[int, int] = {}
        left = best = 0
        for right, song in enumerate(songs):
            seen_at = last.get(song)
            if seen_at is not None and seen_at >= left:
                left = seen_at + 1
            last[song] = right
            best = max(best, right - left + 1)
        return best
