function rotateRight(roster, k) {
  const n = roster.length;
  const shift = k % n;
  const result = new Array(n);
  for (let i = 0; i < n; i++) result[(i + shift) % n] = roster[i];
  return result;
}
