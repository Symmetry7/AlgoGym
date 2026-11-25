1. Adding up each range from scratch costs O(range length) per question, up to 10^10 steps in total.
2. Precompute `prefix[i]`, the total of the first `i` values, with `prefix[0] = 0`.
3. The total of `values[l..r]` is `prefix[r + 1] − prefix[l]`.
