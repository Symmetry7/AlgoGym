A company's reporting chart is a binary tree: each manager has at most two direct reports. Finance wants the total salary paid at each level of the chart.

Nodes are numbered `0` to `n − 1`. `left[i]` and `right[i]` are node `i`'s children, or `-1` when there is none, and `root` is the top node. Node `i` earns `values[i]` rupees.

Return an array whose entry `d` is the total of `values` over all nodes at depth `d`, where `root` is at depth `0`.

## Constraints

- `1 ≤ n ≤ 10^5`, where `n = values.length = left.length = right.length`
- `1 ≤ values[i] ≤ 10^9`
- every node except `root` has exactly one parent, and following children from `root` reaches every node
