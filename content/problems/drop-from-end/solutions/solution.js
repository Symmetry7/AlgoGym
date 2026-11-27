function dropFromEnd(values, next, head, k) {
  const link = next.slice();
  let lead = head;
  for (let i = 0; i < k; i++) lead = link[lead];
  let start = head;
  if (lead === -1) {
    start = link[head];
  } else {
    let trail = head;
    while (link[lead] !== -1) {
      lead = link[lead];
      trail = link[trail];
    }
    link[trail] = link[link[trail]];
  }
  const out = [];
  for (let node = start; node !== -1; node = link[node]) out.push(values[node]);
  return out;
}
