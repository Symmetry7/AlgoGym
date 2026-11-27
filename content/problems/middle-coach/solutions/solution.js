function middleCoach(values, next, head) {
  let slow = head;
  let fast = head;
  while (fast !== -1 && next[fast] !== -1) {
    slow = next[slow];
    fast = next[next[fast]];
  }
  return values[slow];
}
