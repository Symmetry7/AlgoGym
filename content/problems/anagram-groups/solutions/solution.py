class Solution:
    def countAnagramGroups(self, words: list[str]) -> int:
        return len({"".join(sorted(word)) for word in words})
