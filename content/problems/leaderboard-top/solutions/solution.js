function topScores(scores, k) {
  // Binary min-heap stored in an array.
  const heap = [];
  const up = (i) => {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p] <= heap[i]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const down = (i) => {
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < heap.length && heap[l] < heap[m]) m = l;
      if (r < heap.length && heap[r] < heap[m]) m = r;
      if (m === i) return;
      [heap[m], heap[i]] = [heap[i], heap[m]];
      i = m;
    }
  };
  for (const s of scores) {
    if (heap.length < k) {
      heap.push(s);
      up(heap.length - 1);
    } else if (s > heap[0]) {
      heap[0] = s;
      down(0);
    }
  }
  return heap.sort((a, b) => b - a);
}
