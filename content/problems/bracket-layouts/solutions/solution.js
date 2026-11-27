function bracketLayouts(pairs, maxDepth) {
  const out = [];
  const buf = [];
  const go = (open, close) => {
    if (buf.length === 2 * pairs) {
      out.push(buf.join(""));
      return;
    }
    if (open < pairs && open - close < maxDepth) {
      buf.push("(");
      go(open + 1, close);
      buf.pop();
    }
    if (close < open) {
      buf.push(")");
      go(open, close + 1);
      buf.pop();
    }
  };
  go(0, 0);
  return out;
}
