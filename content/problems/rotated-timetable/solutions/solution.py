class Solution:
    def findTrain(self, trains: list[int], target: int) -> int:
        lo, hi = 0, len(trains) - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            if trains[mid] == target:
                return mid
            if trains[lo] <= trains[mid]:
                if trains[lo] <= target < trains[mid]:
                    hi = mid - 1
                else:
                    lo = mid + 1
            else:
                if trains[mid] < target <= trains[hi]:
                    lo = mid + 1
                else:
                    hi = mid - 1
        return -1
