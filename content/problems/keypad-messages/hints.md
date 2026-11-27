1. The first digit has 3 or 4 letter choices, and for each of them the rest of the digits are the same smaller problem.
2. Write `go(i, prefix)`: if `i == digits.length`, record `prefix`; otherwise try each letter of key `digits[i]`.
3. The empty input is special: it has no messages, not one empty message.
