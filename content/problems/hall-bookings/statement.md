A community hall gets booking requests. Request `i` is `[start, end]`: it uses the hall from minute `start` up to, but not including, minute `end`. One event can start at the exact minute another ends.

Given `requests`, return the largest number of requests the hall can accept without any two overlapping.

## Constraints

- `1 ≤ requests.length ≤ 10^5`
- `0 ≤ start < end ≤ 10^9`
