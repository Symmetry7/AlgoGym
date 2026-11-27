function isBalanced(log) {
  const partner = { ")": "(", "]": "[", "}": "{" };
  const stack = [];
  for (const c of log) {
    if (c === "(" || c === "[" || c === "{") stack.push(c);
    else if (stack.pop() !== partner[c]) return false;
  }
  return stack.length === 0;
}
