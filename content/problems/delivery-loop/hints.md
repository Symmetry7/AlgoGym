1. A set of visited stops finds the loop, but uses O(n) memory. Two walkers at different speeds use none.
2. A fast walker (two steps) and a slow walker (one step) meet inside the loop if there is one. If the fast walker reaches `-1`, there is no loop.
3. After they meet, start a new walker at `head` and move it and the slow walker one step at a time. They meet exactly at the start of the loop.
