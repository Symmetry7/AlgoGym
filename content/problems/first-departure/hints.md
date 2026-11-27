1. Scanning from the start works but is O(n). The list is sorted: what does one comparison in the middle tell you?
2. If `departures[mid] < arrival`, that train and every one before it has left. Otherwise `mid` might be the answer, but an earlier train could be too.
3. Keep a half-open range `[lo, hi)` that always contains the answer, starting with `[0, n)`, and stop when it is empty.
