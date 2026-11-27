A drone photographs flooded farmland as a grid. Each cell is `#` for a paddy field still above water or `.` for water.

Fields that touch up, down, left or right belong to the same island (diagonal neighbours don't count). Given the photo `grid` as an array of rows, return the number of islands.

## Constraints

- `1 ≤ grid.length ≤ 300`, `1 ≤ grid[i].length ≤ 300`, and all rows have the same length
- every character is `#` or `.`
