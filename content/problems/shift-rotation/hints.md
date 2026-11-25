1. Rotating one step at a time is O(n · k), and `k` can be 10^9.
2. After `n` rotations the roster is back where it started. Which rotations actually matter?
3. With `k` reduced to `k mod n`, entry `i` ends up at index `(i + k) mod n`.
