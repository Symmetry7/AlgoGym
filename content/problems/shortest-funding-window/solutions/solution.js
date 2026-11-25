function shortestWindowAtLeast(donations, goal) {
  let left = 0;
  let total = 0;
  let best = 0;
  for (let right = 0; right < donations.length; right++) {
    total += donations[right];
    while (total >= goal) {
      const length = right - left + 1;
      if (best === 0 || length < best) best = length;
      total -= donations[left++];
    }
  }
  return best;
}
