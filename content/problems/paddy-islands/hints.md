1. Scan the grid. Each time you reach a field that no island has claimed yet, you've found a new island.
2. From that field, claim every field connected to it, so the scan doesn't count it again.
3. Flood the island with breadth-first search and an explicit queue: recursion can go 90,000 levels deep on one big island.
