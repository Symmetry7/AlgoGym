function reverseRelay(values, next, head) {
  const link = next.slice();
  let prev = -1;
  let cur = head;
  while (cur !== -1) {
    const ahead = link[cur];
    link[cur] = prev;
    prev = cur;
    cur = ahead;
  }
  const order = [];
  for (let node = prev; node !== -1; node = link[node]) order.push(values[node]);
  return order;
}
