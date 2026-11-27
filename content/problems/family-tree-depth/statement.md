A family records its tree with each person listing at most two children. The elders want to know how many generations the tree spans.

The tree is a binary tree. Nodes are numbered `0` to `n − 1`. `left[i]` and `right[i]` are node `i`'s children, or `-1` when there is none, and `root` is the top node.

Return the depth of the tree: the number of nodes on the longest path from `root` down to a node with no children.

## Constraints

- `1 ≤ n ≤ 10^5`, where `n = left.length = right.length`
- every node except `root` has exactly one parent, and following children from `root` reaches every node
