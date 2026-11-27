class Solution:
    def unserved(self, students: list[int], tiffins: list[int]) -> int:
        want = [0, 0]
        for s in students:
            want[s] += 1
        for t in tiffins:
            if want[t] == 0:
                break
            want[t] -= 1
        return want[0] + want[1]
