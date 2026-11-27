1. Walk the list from `head`. At each node you know the node behind you and the node ahead.
2. Point the current node back at the previous one. Save the old `next` first, or you lose the rest of the list.
3. Three variables are enough: `prev`, `cur` and the saved next node. When `cur` reaches `-1`, `prev` is the new head.
