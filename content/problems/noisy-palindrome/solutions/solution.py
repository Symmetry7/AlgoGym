class Solution:
    def isNoisyPalindrome(self, text: str) -> bool:
        lo, hi = 0, len(text) - 1
        while lo < hi:
            if not text[lo].isalnum():
                lo += 1
            elif not text[hi].isalnum():
                hi -= 1
            elif text[lo].lower() != text[hi].lower():
                return False
            else:
                lo += 1
                hi -= 1
        return True
