function treeDepth(left, right, root) {
  let level = [root];
  let depth = 0;
  while (level.length) {
    depth++;
    const next = [];
    for (const node of level) {
      if (left[node] !== -1) next.push(left[node]);
      if (right[node] !== -1) next.push(right[node]);
    }
    level = next;
  }
  return depth;
}
