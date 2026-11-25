1. Changes can be negative, so a growing window's total doesn't only go up. A sliding window won't work.
2. The stretch `(i, j]` totals `prefix[j] − prefix[i]`. You want `prefix[i] = prefix[j] − target`.
3. Walk the days keeping a running total and a count of every prefix total seen so far, starting with one empty prefix (total 0).
