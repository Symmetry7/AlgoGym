function unserved(students, tiffins) {
  const want = [0, 0];
  for (const s of students) want[s]++;
  for (const t of tiffins) {
    if (want[t] === 0) break;
    want[t]--;
  }
  return want[0] + want[1];
}
