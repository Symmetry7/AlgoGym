1. Trying `s = 0, 1, 2, …` works but takes up to 3 × 10^7 steps. Can you halve the candidates each time?
2. `s × s ≤ area` is true for every `s` up to the answer and false after it: binary search for the last true.
3. Watch the multiplication: `s × s` near `3 × 10^7` is about `10^15`, which overflows a 32-bit integer.
