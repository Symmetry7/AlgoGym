import { writeFileSync } from 'node:fs';

const roles = [
  ['Development','frontend-developer','Frontend Developer'],
  ['Development','backend-developer','Backend Developer'],
  ['Development','fullstack-developer','Fullstack Developer'],
  ['Development','mobile-developer','Mobile Developer'],
  ['Development','game-developer','Game Developer'],
  ['Development','web3-developer','Web3 Developer'],
  ['Development','embedded-systems-engineer','Embedded Systems Engineer'],
  ['Data & AI','data-analyst','Data Analyst'],
  ['Data & AI','data-engineer','Data Engineer'],
  ['Data & AI','data-scientist','Data Scientist'],
  ['Data & AI','ai-engineer','AI Engineer'],
  ['Data & AI','ai-research-engineer','AI Research Engineer'],
  ['Data & AI','llm-genai-engineer','LLM & GenAI Engineer'],
  ['Data & AI','mlops-engineer','MLOps Engineer'],
  ['DevOps & Cloud','devops-engineer','DevOps Engineer'],
  ['DevOps & Cloud','cloud-engineer','Cloud Engineer'],
  ['DevOps & Cloud','site-reliability-engineer','Site Reliability Engineer'],
  ['Security & QA','cloud-security-engineer','Cloud Security Engineer'],
  ['Security & QA','cybersecurity-analyst','Cybersecurity Analyst'],
  ['Security & QA','qa-sdet-engineer','QA/SDET Engineer'],
];
const decode = (value) => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&#x27;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
async function load(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'AlgoGym public reference audit' }, signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`${response.status} ${url}`);
      return response.text();
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
    }
  }
}
const out = [];
for (let start = 0; start < roles.length; start += 3) {
  const batch = await Promise.all(roles.slice(start, start + 3).map(async ([group, slug, title]) => {
    const sourceUrl = `https://hynts.in/preparation/role-wise/${slug}/`;
    const html = await load(sourceUrl);
    const matches = [...html.matchAll(/&quot;index&quot;:\[0,(\d+)\]/g)];
    const questions = matches.map((match, index) => {
      const row = html.slice(match.index, matches[index + 1]?.index ?? html.length);
      const title = row.match(/&quot;(?:title|question)&quot;:\[0,&quot;(.*?)&quot;\],&quot;answer&quot;:/)?.[1];
      const difficulty = row.match(/&quot;difficulty&quot;:\[0,&quot;(.*?)&quot;\]/)?.[1];
      const category = row.match(/&quot;category&quot;:\[0,&quot;(.*?)&quot;\]/)?.[1];
      return { index: index + 1, title: title ? decode(title) : '', difficulty: difficulty === 'Beginner' ? 'Easy' : difficulty === 'Intermediate' ? 'Medium' : difficulty === 'Advanced' ? 'Hard' : null, category: category ? decode(category) : null };
    }).filter((question) => question.title);
    if (questions.length < 100 || questions.some((q) => q.title.length > 220)) throw new Error(`${slug}: invalid public title list, ${questions.length} rows`);
    return { group, slug, title, sourceUrl, questions };
  }));
  out.push(...batch);
  process.stdout.write(`${out.length}/${roles.length}: ${batch.map((item) => `${item.slug} ${item.questions.length}`).join(', ')}\n`);
  await new Promise((resolve) => setTimeout(resolve, 300));
}
writeFileSync('data/interview-role-reference.json', `${JSON.stringify({ observedAt: new Date().toISOString().slice(0, 10), roles: out }, null, 2)}\n`);
console.log(JSON.stringify({roles:out.length, rows:out.reduce((n, role)=>n+role.questions.length,0), uniqueTitles:new Set(out.flatMap((role)=>role.questions.map((q)=>q.title))).size}));
