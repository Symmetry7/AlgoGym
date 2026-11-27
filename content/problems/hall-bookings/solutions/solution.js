function maxBookings(requests) {
  const sorted = [...requests].sort((a, b) => a[1] - b[1]);
  let free = -Infinity;
  let count = 0;
  for (const [start, end] of sorted) {
    if (start >= free) {
      count++;
      free = end;
    }
  }
  return count;
}
