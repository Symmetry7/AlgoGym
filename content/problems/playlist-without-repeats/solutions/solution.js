function longestUniqueStretch(songs) {
  const last = new Map();
  let left = 0;
  let best = 0;
  for (let right = 0; right < songs.length; right++) {
    const seenAt = last.get(songs[right]);
    if (seenAt !== undefined && seenAt >= left) left = seenAt + 1;
    last.set(songs[right], right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}
