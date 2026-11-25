class Solution:
    def compressRuns(self, signal: str) -> str:
        parts: list[str] = []
        start = 0
        for i in range(1, len(signal) + 1):
            if i == len(signal) or signal[i] != signal[start]:
                parts.append(signal[start] + str(i - start))
                start = i
        return "".join(parts)
