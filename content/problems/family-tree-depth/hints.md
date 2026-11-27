1. The depth of a tree is 1 plus the larger depth of its two subtrees.
2. Recursion is natural, but the tree can be a single chain of 10^5 nodes. What happens to a deep recursion?
3. Walk level by level instead: keep the nodes of the current level, build the next level from their children, and count the levels.
