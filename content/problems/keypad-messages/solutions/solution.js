function keypadMessages(digits) {
  if (digits.length === 0) return [];
  const keys = ["", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"];
  const out = [];
  const buf = [];
  const go = (i) => {
    if (i === digits.length) {
      out.push(buf.join(""));
      return;
    }
    for (const c of keys[digits.charCodeAt(i) - 48]) {
      buf.push(c);
      go(i + 1);
      buf.pop();
    }
  };
  go(0);
  return out;
}
