A row of vertical panels stands one metre apart; `heights[i]` is the height of panel `i`. Pick two panels `i < j` as the walls of a tank. The water level can't rise above the shorter wall, so the tank's front area is `(j − i) × min(heights[i], heights[j])`.

Return the largest area you can get.

## Constraints

- `2 ≤ heights.length ≤ 10^5`
- `0 ≤ heights[i] ≤ 10^4`
