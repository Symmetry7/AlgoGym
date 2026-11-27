1. For each item there are exactly two choices: take it or leave it. How many picks does that give for `n` items?
2. Write a function `go(i)` that decides item `i` both ways and recurses on `i + 1`. When `i == n`, the current pick is complete.
3. Keep one working list: append the item, recurse, then remove it again before trying the "leave it" branch (backtracking).
