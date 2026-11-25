import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const lists = JSON.parse(readFileSync('data/interview-reference-collections.json', 'utf8')).playlists;
mkdirSync('public/interview-playlist-thumbnails', { recursive: true });
for (const playlist of lists) {
  const response = await fetch(playlist.thumbnail, { signal: AbortSignal.timeout(20000) });
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/'))
    throw new Error(`${playlist.slug}: thumbnail unavailable (${response.status})`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1500) throw new Error(`${playlist.slug}: thumbnail too small`);
  writeFileSync(`public/interview-playlist-thumbnails/${playlist.slug}.jpg`, bytes);
  console.log(`${playlist.slug}: ${bytes.length} bytes`);
}
