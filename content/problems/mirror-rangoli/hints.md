1. Compare the root's left subtree with its right subtree, not each subtree with itself.
2. Two subtrees `a` and `b` are mirrors when their roots match, `a.left` mirrors `b.right`, and `a.right` mirrors `b.left`.
3. Keep a queue of pairs to compare, starting with `(left[root], right[root])`. A pair with exactly one missing node fails.
