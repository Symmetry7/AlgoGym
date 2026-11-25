function countAnagramGroups(words) {
  const keys = new Set();
  for (const word of words) keys.add([...word].sort().join(""));
  return keys.size;
}
