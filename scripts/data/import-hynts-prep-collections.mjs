import { writeFileSync } from 'node:fs';

const root = 'https://hynts.in/preparation';
const decode = (value) => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&#x27;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
async function read(path) {
  const url = `${root}/${path}`;
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
const sqlHtml = await read('sql-sheet/');
const sqlMatches = [...sqlHtml.matchAll(/&quot;index&quot;:\[0,(\d+)\],&quot;title&quot;:\[0,&quot;(.*?)&quot;\],&quot;answer&quot;:/g)];
const sql = sqlMatches.map((match, index) => {
  const row = sqlHtml.slice(match.index, sqlMatches[index + 1]?.index ?? sqlHtml.length);
  const sourceDifficulty = row.match(/&quot;difficulty&quot;:\[0,&quot;(.*?)&quot;\]/)?.[1];
  const category = row.match(/&quot;category&quot;:\[0,&quot;(.*?)&quot;\]/)?.[1];
  return { index: index + 1, title: decode(match[2]), difficulty: sourceDifficulty === 'Beginner' ? 'Easy' : sourceDifficulty === 'Intermediate' ? 'Medium' : sourceDifficulty === 'Advanced' ? 'Hard' : null, category: category ? decode(category) : null };
});
if (sql.length !== 110 || sql.some((item) => !item.difficulty)) throw new Error(`Expected 110 SQL prompts with difficulty, found ${sql.length}`);
const systemHtml = await read('system-design-sheet/');
const system = [...systemHtml.matchAll(/&quot;title&quot;:\[0,&quot;([^&]*)&quot;\],&quot;type&quot;:\[0,&quot;(HLD|LLD)&quot;\],&quot;articleLink&quot;:\[0,&quot;(.*?)&quot;\],&quot;ytLink&quot;:\[0,&quot;(.*?)&quot;\]/g)].map((match, index) => ({ index: index + 1, title: decode(match[1]), level: match[2], articleUrl: decode(match[3]), videoUrl: decode(match[4]) }));
if (system.length !== 32 || system.filter((q) => q.level === 'HLD').length !== 22) throw new Error(`System design rows: ${system.length}`);

const playlistGroups = {
  'dsa-playlists': [
    ['love-babbar-dsa-playlist', 'Love Babbar DSA', 'Love Babbar'],
    ['shradha-khapra-dsa-playlist', 'Shradha Khapra DSA', 'Shradha Khapra'],
    ['rohit-negi-dsa-playlist', 'Rohit Negi DSA', 'Rohit Negi'],
  ],
  'dbms-playlists': [
    ['love-babbar-dbms-playlist', 'Love Babbar DBMS', 'Love Babbar'],
    ['riti-kumari-dbms-playlist', 'Riti Kumari DBMS', 'Riti Kumari'],
  ],
  'os-playlists': [
    ['love-babbar-os-playlist', 'Love Babbar OS', 'Love Babbar'],
    ['riti-kumari-os-playlist', 'Riti Kumari OS', 'Riti Kumari'],
    ['vivek-gupta-os-playlist', 'Vivek Gupta OS', 'Vivek Gupta'],
    ['neso-academy-os-playlist', 'Neso Academy OS', 'Neso Academy'],
  ],
  'oops-playlists': [
    ['code-with-harry-oops-playlist', 'Code With Harry OOP', 'Code With Harry'],
    ['rohit-negi-oops-playlist', 'Rohit Negi OOP', 'Rohit Negi'],
    ['kunal-kushwaha-oops-playlist', 'Kunal Kushwaha OOP', 'Kunal Kushwaha'],
    ['jenny-lecture-oops-playlist', "Jenny's OOP", "Jenny's Lectures"],
  ],
  'system-design-playlists': [
    ['gaurav-sen-system-design-playlist', 'Gaurav Sen HLD', 'Gaurav Sen'],
    ['exponent-system-design-playlist', 'Exponent HLD', 'Exponent'],
    ['hello-interview-system-design-playlist', 'Hello Interview HLD', 'Hello Interview'],
    ['code-with-aryan-system-design-playlist', 'Code With Aryan LLD', 'Code With Aryan'],
    ['coder-army-system-design-playlist', 'Coder Army LLD', 'Coder Army'],
    ['engineering-digest-system-design-playlist', 'Engineering Digest HLD', 'Engineering Digest'],
  ],
};
const playlistSpecs = Object.entries(playlistGroups).flatMap(([group, items]) => items.map(([slug, title, creator]) => ({ group, slug, title, creator })));
const playlists = [];
for (let offset = 0; offset < playlistSpecs.length; offset += 3) {
  const batch = await Promise.all(playlistSpecs.slice(offset, offset + 3).map(async (spec) => {
    let html;
    try { html = await read(`${spec.group}/${spec.slug}/`); }
    catch (error) { process.stdout.write(`Unavailable reference ${spec.group}/${spec.slug}: ${error.message}\n`); return null; }
    const videos = [...html.matchAll(/&quot;index&quot;:\[0,(\d+)\],&quot;title&quot;:\[0,&quot;(.*?)&quot;\],&quot;link&quot;:\[0,&quot;(.*?)&quot;\]/g)]
      .map((match, index) => ({ index: index + 1, title: decode(match[2]), url: decode(match[3]) }))
      .filter((video) => /^https:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\//.test(video.url));
    if (videos.length < 5) { process.stdout.write(`Unavailable video list ${spec.group}/${spec.slug}: ${videos.length}\n`); return null; }
    const first = new URL(videos[0].url);
    const videoId = first.hostname === 'youtu.be' ? first.pathname.slice(1) : first.searchParams.get('v');
    return { ...spec, sourceUrl: `${root}/${spec.group}/${spec.slug}/`, thumbnail: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null, videos };
  }));
  playlists.push(...batch.filter(Boolean));
  process.stdout.write(`${playlists.length}/${playlistSpecs.length} playlists\n`);
  await new Promise((resolve) => setTimeout(resolve, 350));
}
writeFileSync('data/interview-reference-collections.json', `${JSON.stringify({ observedAt: new Date().toISOString().slice(0, 10), sql, system, playlists }, null, 2)}\n`);
console.log(JSON.stringify({ sql: sql.length, system: system.length, playlists: playlists.length, videos: playlists.reduce((n, item) => n + item.videos.length, 0), missingThumbnails: playlists.filter((item) => !item.thumbnail).map((item) => item.slug) }));
