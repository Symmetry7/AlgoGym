1. Comparing every pair is too slow for 100,000 scans. What do two colliding scans have in common?
2. Group scans by code. A code that appears `c` times forms `c × (c − 1) / 2` pairs.
3. You can also add up the answer while scanning: each new scan collides with every earlier scan of the same code.
4. The answer can be larger than 2^31 − 1. Pick an integer type that holds it.
