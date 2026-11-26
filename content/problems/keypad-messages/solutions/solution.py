class Solution:
    def keypadMessages(self, digits: str) -> list[str]:
        if not digits:
            return []
        keys = ["", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"]
        out, buf = [], []

        def go(i: int) -> None:
            if i == len(digits):
                out.append("".join(buf))
                return
            for c in keys[int(digits[i])]:
                buf.append(c)
                go(i + 1)
                buf.pop()

        go(0)
        return out
