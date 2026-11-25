## Approach: two pointers, one per list

Keep `i` in `left` and `j` in `right`. While both have values, append the smaller of `left[i]` and `right[j]` (either on a tie) and advance that pointer. Then append whatever remains of the other list.

Concatenating and sorting also gives the right answer, but costs O((n + m) log(n + m)) and ignores the order you were given.

## Complexity

| | |
| --- | --- |
| Time | O(n + m) |
| Space | O(n + m) for the result |

## Common mistakes

- Dropping the leftover values once one list is empty (hidden test: every value in `left` is larger than every value in `right`).
- Indexing an empty list (hidden tests: one or both lists empty).
