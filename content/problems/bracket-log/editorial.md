## Approach: a stack of open brackets

Scan the log. Push every opening bracket. For a closing bracket, the stack must be non-empty and its top must be the matching opening bracket; pop it. The log is balanced exactly when no check fails and the stack is empty at the end.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(n) in the worst case (all opening brackets) |

## Common mistakes

- Counting brackets per kind instead of using a stack (hidden test: `{[}]` expects `false`, like the public `([)]`).
- Forgetting the final emptiness check (hidden test: `((((` expects `false`).
- Popping from an empty stack on a leading closing bracket (hidden test: `]`).
