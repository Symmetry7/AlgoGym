1. Counting the songs first works in two passes. For one pass, think about a gap between two walkers.
2. Move a `lead` walker `k` songs ahead. Then move `lead` and a `trail` walker together until `lead` is on the last song.
3. `trail` now sits just before the song to remove. Handle `k = n` separately: then the head itself goes.
