function allPicks(items) {
  const out = [];
  const cur = [];
  const go = (i) => {
    if (i === items.length) {
      out.push(cur.slice());
      return;
    }
    go(i + 1);
    cur.push(items[i]);
    go(i + 1);
    cur.pop();
  };
  go(0);
  return out;
}
