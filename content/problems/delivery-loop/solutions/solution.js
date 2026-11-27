function loopStart(next, head) {
  let slow = head;
  let fast = head;
  while (fast !== -1 && next[fast] !== -1) {
    slow = next[slow];
    fast = next[next[fast]];
    if (slow === fast) {
      let p = head;
      while (p !== slow) {
        p = next[p];
        slow = next[slow];
      }
      return p;
    }
  }
  return -1;
}
