A sensor link sends long strings of status letters, and most letters repeat many times in a row. To save bandwidth, every maximal run of the same letter is replaced by the letter followed by the run's length: `"aaabcc"` becomes `"a3b1c2"`.

Return the compressed form of `signal`.

## Constraints

- `1 ≤ signal.length ≤ 10^5`
- `signal` contains only lowercase letters.
