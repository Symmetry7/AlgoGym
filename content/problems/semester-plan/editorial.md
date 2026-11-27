## Approach: Kahn's algorithm (topological sort)

Count each course's prerequisites (`indegree`) and list, for each course, the courses it unlocks. Queue every course with indegree 0. Take courses from the queue: for each course it unlocks, lower that indegree, and queue it when it reaches 0. If the number of courses taken equals `courses`, an order exists. Otherwise the leftover courses sit on a cycle and can never be started.

## Complexity

| | |
| --- | --- |
| Time | O(courses + prerequisites) |
| Space | O(courses + prerequisites) |

## Common mistakes

- Missing self-rules like `[3, 3]`: a course that needs itself can never be taken (hidden test).
- Recursive depth-first cycle detection on a 10^5-course chain overflows the stack (hidden test).
