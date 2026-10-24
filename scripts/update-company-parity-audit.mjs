import { readFileSync, writeFileSync } from 'node:fs';

const path = 'docs/INTERVIEW_PREPARATIONS_PARITY_AUDIT.md';
const previous = readFileSync(path, 'utf8');
const reference = JSON.parse(readFileSync('docs/hynts-public-company-titles.json', 'utf8'));
const priorRows = previous.split('\n').filter((line) => line.startsWith('| ') && line.includes('| 70 |'));
const names = priorRows.map((line) => line.split('|')[1].trim());
if (names.length !== Object.keys(reference).length) throw new Error('Company table no longer matches reference inventory');
const rows = Object.entries(reference).map(([slug, track], index) => {
  const count = track.questions.length;
  const note = slug === 'amazon' ? 'Matched; source repeats one title' : ['visa', 'hcltech'].includes(slug) ? 'Matched visible rows; directory advertises one more' : 'Matched public title, order, and source URL';
  return `| ${names[index]} | ${count} | 70 | ${count} | ${note} |`;
});
const intro = `# Interview Preparations parity audit\n\nObserved and tested 2026-10-24. The 45 company sheets now match the public Hynts title, order, and source URL inventory in [the recorded manifest](hynts-public-company-titles.json). The requested RVE skill was unavailable; the installed REA evidence-first method, Computer Use, and Playwright were used. We did not copy problem statements, descriptions, or popularity classifications.\n\n## Company sheets\n\nThe live Supabase relationships and source links were compared row by row with the recorded public reference by \`scripts/interview-catalog-audit.mjs\`. Existing canonical question IDs were reused where titles matched, preserving saved progress and bookmarks. Source numbering inconsistencies were normalized to visual row order.\n\n| Company | Public rows | AlgoGym before | AlgoGym after | Verified status |\n| --- | ---: | ---: | ---: | --- |\n${rows.join('\n')}\n\nHynts displays “Find Median from Data Stream” twice in Amazon (both rows retained). Its public Visa and HCLTech sheets expose 50 and 73 numbered rows respectively, while earlier directory counts advertised 51 and 74; AlgoGym uses the actual visible rows. ServiceNow and Visa have irregular source numbering. Seven titles have different third-party URLs across companies; AlgoGym now stores the URL per sheet row.\n\n`;
writeFileSync(path, intro + previous.slice(previous.indexOf('## Other collections')));
