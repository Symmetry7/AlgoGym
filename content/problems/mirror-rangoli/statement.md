A rangoli design is planned as a binary tree of colour codes. It looks balanced only if the left half is an exact mirror image of the right half.

Nodes are numbered `0` to `n − 1`. `left[i]` and `right[i]` are node `i`'s children, or `-1` when there is none, and `root` is the top node. Node `i` has colour `values[i]`.

Return `true` if the tree is a mirror image of itself around its centre: the same shape and the same colours, with left and right swapped at every level.

## Constraints

- `1 ≤ n ≤ 10^5`, where `n = values.length = left.length = right.length`
- `0 ≤ values[i] ≤ 10^9`
- every node except `root` has exactly one parent, and following children from `root` reaches every node
