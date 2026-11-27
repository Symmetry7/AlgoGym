1. Counting each kind separately isn't enough: `([)]` has matching counts but is wrong.
2. A closing bracket must match the most recent opening bracket that is still open. Which structure gives you "most recent" in O(1)?
3. Push opening brackets on a stack. On a closing bracket, the top must be its partner. At the end, the stack must be empty.
