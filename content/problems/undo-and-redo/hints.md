1. Undo always removes the last word, so the document behaves like a stack.
2. Keep a second stack of undone words. Undo moves a word from the document to it; redo moves it back.
3. What must happen to the redo stack when a new word is typed?
