function isMirror(values, left, right, root) {
  const queue = [[left[root], right[root]]];
  for (let head = 0; head < queue.length; head++) {
    const [a, b] = queue[head];
    if (a === -1 && b === -1) continue;
    if (a === -1 || b === -1 || values[a] !== values[b]) return false;
    queue.push([left[a], right[b]], [right[a], left[b]]);
  }
  return true;
}
