1. Build the string one character at a time. At any point, how many `(` can you still add, and when is a `)` allowed?
2. You may add `(` while fewer than `pairs` are used and fewer than `maxDepth` are open. You may add `)` while some bracket is still open.
3. Every path that follows both rules ends in a valid string, so the recursion never builds anything it throws away.
