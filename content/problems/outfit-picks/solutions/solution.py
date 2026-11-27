class Solution:
    def allPicks(self, items: list[str]) -> list[list[str]]:
        out, cur = [], []

        def go(i: int) -> None:
            if i == len(items):
                out.append(cur[:])
                return
            go(i + 1)
            cur.append(items[i])
            go(i + 1)
            cur.pop()

        go(0)
        return out
