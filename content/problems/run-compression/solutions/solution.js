function compressRuns(signal) {
  const parts = [];
  let start = 0;
  for (let i = 1; i <= signal.length; i++) {
    if (i === signal.length || signal[i] !== signal[start]) {
      parts.push(signal[start] + (i - start));
      start = i;
    }
  }
  return parts.join("");
}
