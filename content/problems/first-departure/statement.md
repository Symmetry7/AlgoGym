A railway enquiry screen lists the day's departures from one platform in time order. You reach the platform at minute `arrival` and will take the first train that leaves at that minute or later.

Given the sorted departure times `departures` and your arrival time `arrival`, return the index of the first departure at or after `arrival`. If every train has already left, return `departures.length`.

## Constraints

- `1 ≤ departures.length ≤ 10^5`
- `0 ≤ departures[i] ≤ 10^9`, sorted in non-decreasing order (several trains can share a minute)
- `0 ≤ arrival ≤ 10^9`
