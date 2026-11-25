1. Keep a window `[left, right]` with no repeats and grow it one play at a time.
2. When `songs[right]` is already in the window, the window must start after that song's previous play.
3. Remember the last index of every id. The new `left` is `max(left, last[id] + 1)`; it must never move backwards.
