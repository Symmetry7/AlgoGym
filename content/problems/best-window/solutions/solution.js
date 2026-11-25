function maxWindowSum(readings, k) {
  let window = 0;
  for (let i = 0; i < k; i++) window += readings[i];
  let best = window;
  for (let i = k; i < readings.length; i++) {
    window += readings[i] - readings[i - k];
    if (window > best) best = window;
  }
  return best;
}
