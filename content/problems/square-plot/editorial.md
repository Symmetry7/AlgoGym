## Approach: binary search on the side

The predicate `s × s ≤ area` holds for `s = 0, 1, …, answer` and fails after that. Search `s` in `[0, min(area, 31622777)]` (31622777² already exceeds `10^15`). With `mid` rounded up, keep `lo = mid` when `mid × mid ≤ area`, otherwise `hi = mid − 1`. Use 64-bit integers for the product.

## Complexity

| | |
| --- | --- |
| Time | O(log area) |
| Space | O(1) |

## Common mistakes

- Squaring in 32-bit integers: `mid × mid` overflows for large areas (hidden test: `area = 10^15` expects `31622776`).
- Rounding `mid` down with `lo = mid`: the loop never ends when `hi = lo + 1`.
- Floating-point square roots can be off by one just below a perfect square (hidden test: `999999961946175`).
