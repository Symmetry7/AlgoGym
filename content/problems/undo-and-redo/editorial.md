## Approach: two stacks

- Word: push it onto `document` and **clear** `redo`.
- `<`: if `document` is not empty, pop its last word and push it onto `redo`.
- `>`: if `redo` is not empty, pop its last word and push it onto `document`.

At the end, join `document` with spaces.

## Complexity

| | |
| --- | --- |
| Time | O(n + total output length) |
| Space | O(n) |

## Common mistakes

- Not clearing the redo stack on a new word: `["a", "b", "<", "c", ">"]` must give `"a c"`, not `"a c b"` (hidden test).
- Saving a full copy of the document for every action: O(n²) time and memory on long logs (hidden test: 10^5 actions).
