function canFinish(courses, prerequisites) {
  const indegree = new Array(courses).fill(0);
  const unlocks = Array.from({ length: courses }, () => []);
  for (const [a, b] of prerequisites) {
    unlocks[b].push(a);
    indegree[a]++;
  }
  const queue = [];
  for (let c = 0; c < courses; c++) if (indegree[c] === 0) queue.push(c);
  for (let head = 0; head < queue.length; head++) {
    for (const next of unlocks[queue[head]]) {
      if (--indegree[next] === 0) queue.push(next);
    }
  }
  return queue.length === courses;
}
