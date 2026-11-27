## Approach: count preferences, then walk the stack

Rotating the queue only changes who is at the front, never who is in it. So the top tiffin is eventually taken if and only if some waiting student wants that kind. Count `want[0]` and `want[1]`. Go through `tiffins` from the top: if `want[t] > 0`, one such student takes it (`want[t]−−`); otherwise everything stops. The answer is `want[0] + want[1]` at that point.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(1) |

## Common mistakes

- Simulating rotations with a fixed cap like "stop after n moves": the queue can need up to n rotations per tiffin, so a cap gives wrong answers, and an uncapped simulation is O(n²) on 10^5 students (hidden test).
- Stopping only when the queue is empty: it can get stuck with students who all want the other kind (hidden test: all students want veg, all tiffins non-veg).
