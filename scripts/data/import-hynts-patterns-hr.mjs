import { writeFileSync } from 'node:fs';

const base = 'https://hynts.in/preparation/';
const decode = (s) => s.replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&#x27;', "'").replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const unwrap = (value) => Array.isArray(value) && value.length === 2 && (value[0] === 0 || value[0] === 1)
  ? unwrap(value[1])
  : Array.isArray(value) ? value.map(unwrap)
  : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, unwrap(inner)]))
  : value;
async function props(path, needle) {
  const response = await fetch(base + path, {signal: AbortSignal.timeout(30000)});
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  const html = await response.text();
  const attr = [...html.matchAll(/<astro-island[^>]*props="([^"]*)"[^>]*>/g)].map((item) => item[1]).find((item) => item.includes(needle));
  if (!attr) throw new Error(`Missing ${needle} on ${path}`);
  return unwrap(JSON.parse(decode(attr)));
}
const patterns = await props('20-essential-dsa-patterns/', 'totalProblems');
const hr = await props('hr-questions/', '&quot;questions&quot;');
const groups = patterns.sections.map((section) => ({
  topic: section.topic,
  subTopic: section.subTopic,
  problems: section.problems.map((question) => ({ title: question.title, url: question.problemUrl, platform: question.platform, difficulty: question.difficulty })),
}));
const questions = hr.questions.map((question) => ({ index: question.index, title: question.title, difficulty: question.difficulty, category: question.category }));
const count = groups.reduce((sum, group) => sum + group.problems.length, 0);
if (count !== 180 || questions.length !== 100) throw new Error(`Unexpected reference inventory: ${count} patterns / ${questions.length} HR`);
writeFileSync('data/interview-pattern-hr-reference.json', `${JSON.stringify({observedAt:new Date().toISOString().slice(0,10),groups,hr:questions},null,2)}\n`);
console.log(JSON.stringify({groups:groups.length,patterns:count,uniqueUrls:new Set(groups.flatMap((group)=>group.problems.map((item)=>item.url))).size,hr:questions.length,groupCounts:groups.map((group)=>[group.topic,group.problems.length])}));
