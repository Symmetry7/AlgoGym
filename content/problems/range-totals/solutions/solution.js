function rangeTotals(values, lefts, rights) {
  const prefix = [0];
  for (const v of values) prefix.push(prefix[prefix.length - 1] + v);
  return lefts.map((l, j) => prefix[rights[j] + 1] - prefix[l]);
}
