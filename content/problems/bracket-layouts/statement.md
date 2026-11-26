A style checker accepts nested brackets only up to a limit, so a test generator needs every correctly nested string within that limit.

Given `pairs` and `maxDepth`, return every string of `pairs` opening and `pairs` closing round brackets that is correctly nested and never has more than `maxDepth` brackets open at once. Return them in any order.

## Constraints

- `1 ≤ maxDepth ≤ pairs ≤ 10`
