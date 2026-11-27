function countIslands(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const seen = new Uint8Array(rows * cols);
  const queue = new Int32Array(rows * cols);
  let islands = 0;
  for (let start = 0; start < rows * cols; start++) {
    if (seen[start] || grid[Math.floor(start / cols)][start % cols] !== "#") continue;
    islands++;
    seen[start] = 1;
    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    while (head < tail) {
      const cell = queue[head++];
      const r = Math.floor(cell / cols);
      const c = cell % cols;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
        const next = nr * cols + nc;
        if (!seen[next] && grid[nr][nc] === "#") {
          seen[next] = 1;
          queue[tail++] = next;
        }
      }
    }
  }
  return islands;
}
