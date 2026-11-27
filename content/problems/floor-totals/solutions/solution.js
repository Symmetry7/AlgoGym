function levelTotals(values, left, right, root) {
  const totals = [];
  let level = [root];
  while (level.length) {
    let sum = 0;
    const next = [];
    for (const node of level) {
      sum += values[node];
      if (left[node] !== -1) next.push(left[node]);
      if (right[node] !== -1) next.push(right[node]);
    }
    totals.push(sum);
    level = next;
  }
  return totals;
}
