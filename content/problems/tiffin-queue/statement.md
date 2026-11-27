At a hostel mess, students wait in a queue and the tiffins are stacked on the counter. Each student wants either a veg tiffin (`0`) or a non-veg tiffin (`1`), and so is each tiffin.

The student at the front looks at the top tiffin. If it is what they want, they take it and leave. If not, they go to the back of the queue. This repeats until nobody left in the queue wants the top tiffin.

Given the queue `students` (front first) and the stack `tiffins` (top first), return how many students go without a tiffin.

## Constraints

- `1 ≤ students.length = tiffins.length ≤ 10^5`
- every `students[i]` and `tiffins[i]` is `0` or `1`
