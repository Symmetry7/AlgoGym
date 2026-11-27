1. Cut the array at any `mid`. At least one of the two halves is still sorted. How can you tell which one?
2. Compare `trains[lo]` with `trains[mid]`. If `trains[lo] ≤ trains[mid]`, the left half is sorted.
3. In the sorted half, a range check tells you whether `target` is there. If not, it must be in the other half.
