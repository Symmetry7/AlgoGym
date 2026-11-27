class Solution:
    def bracketLayouts(self, pairs: int, maxDepth: int) -> list[str]:
        out, buf = [], []

        def go(open_: int, close: int) -> None:
            if len(buf) == 2 * pairs:
                out.append("".join(buf))
                return
            if open_ < pairs and open_ - close < maxDepth:
                buf.append("(")
                go(open_ + 1, close)
                buf.pop()
            if close < open_:
                buf.append(")")
                go(open_, close + 1)
                buf.pop()

        go(0, 0)
        return out
