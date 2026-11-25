A tiny editor starts with an empty document. Each entry of `actions` is one of:

- a lowercase word: append it to the end of the document;
- `"<"`: **undo** the most recent append that is still in the document;
- `">"`: **redo** the most recently undone append.

Appending a new word clears everything that could be redone. An undo with nothing to undo, or a redo with nothing to redo, does nothing.

Return the final document as its words joined by single spaces, or an empty string if it has no words.

## Constraints

- `1 ≤ actions.length ≤ 10^5`
- Each action is `"<"`, `">"`, or a word of 1 to 4 lowercase letters.
