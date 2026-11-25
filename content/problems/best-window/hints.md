1. Re-adding `k` readings for every window is O(n · k). How do two neighbouring windows differ?
2. Moving the window one step right adds one reading and removes one.
3. Start the best total from the first window's sum, not from 0: every window may be negative.
