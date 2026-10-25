import { readFileSync, writeFileSync } from 'node:fs';

// Publicly displayed titles/order only. Do not import gated descriptions,
// editorial popularity labels, or question statements from the reference.
const sourceSlugs = {
  'd-e-shaw': 'de-shaw',
  'tower-research-capital': 'tower-research',
  'j-p-morgan-chase': 'jpmorgan-chase',
  'tcs-tcs-nqt': 'tcs',
  hcltech: 'hcl',
};
const oldManifest = JSON.parse(readFileSync('docs/interview-editorial-manifest.json', 'utf8'));
const companySlugs = Object.keys(oldManifest.companyTracks);
const entity = (text) => text.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const results = {};
for (const slug of companySlugs) {
  const referenceSlug = sourceSlugs[slug] ?? slug;
  const url = `https://hynts.in/preparation/company-wise-dsa-sheet/${referenceSlug}-dsa-interview-questions/`;
  let html;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'AlgoGym reference audit (public pages)' } });
      if (!response.ok) throw new Error(`${response.status}`);
      html = await response.text();
      break;
    } catch (error) {
      if (attempt === 2) throw new Error(`${slug}: ${error}`);
      await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 2000));
    }
  }
  const matches = [...html.matchAll(/&quot;index&quot;:\[0,(\d+)\],&quot;question_name&quot;:\[0,&quot;(.*?)&quot;\]/g)];
  const questions = matches.map((match, index) => {
    const next = matches[index + 1]?.index ?? html.length;
    const serializedRow = html.slice(match.index, next);
    const platform = serializedRow.match(/&quot;platform_name&quot;:\[0,&quot;(.*?)&quot;\]/)?.[1];
    const link = serializedRow.match(/&quot;platform_link&quot;:\[0,&quot;(.*?)&quot;\]/)?.[1];
    const difficulty = serializedRow.match(/&quot;difficulty&quot;:\[0,&quot;(Easy|Medium|Hard)&quot;\]/)?.[1] ?? null;
    return { position: index + 1, referenceIndex: Number(match[1]), title: entity(match[2]), platform: platform ? entity(platform) : null, url: link ? entity(link) : null, difficulty };
  });
  if (questions.length < 20) throw new Error(`${slug}: found only ${questions.length} numbered rows`);
  const irregular = questions.filter((q) => q.position !== q.referenceIndex);
  if (irregular.length) process.stdout.write(`${slug} irregular reference numbering: ${irregular.map((q) => `${q.position}->${q.referenceIndex}`).join(', ')}\n`);
  const repeatedTitles = [...new Set(questions.map((q) => q.title).filter((title, index) => questions.findIndex((q) => q.title === title) !== index))];
  if (repeatedTitles.length) process.stdout.write(`${slug} repeated titles: ${repeatedTitles.join(', ')}\n`);
  results[slug] = { sourceUrl: url, observedAt: new Date().toISOString().slice(0, 10), questions };
  process.stdout.write(`${slug}: ${questions.length}\n`);
  await new Promise((resolve) => setTimeout(resolve, 450));
}
writeFileSync('docs/hynts-public-company-titles.json', `${JSON.stringify(results, null, 2)}\n`);
