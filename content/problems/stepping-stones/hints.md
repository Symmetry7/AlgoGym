1. You don't need to know which jumps to make, only how far you could possibly get.
2. Walk the stones in order, tracking the farthest stone reachable so far. What does it mean if you're standing beyond it?
3. If stone `i` is within the farthest reach, update the reach with `i + reach[i]`. If you ever pass the farthest reach, the rest is unreachable.
