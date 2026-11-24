import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const source = JSON.parse(readFileSync('data/interview-reference-collections.json', 'utf8'));
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const currentResponse = await fetch('https://algogym.vercel.app/api/interview?mode=questions', { signal: AbortSignal.timeout(30000) });
if (!currentResponse.ok) throw new Error(`Could not read existing canonical questions: ${currentResponse.status}`);
const current = (await currentResponse.json()).questions ?? [];
const byTitle = new Map(current.map((item) => [item.title.toLowerCase(), item]));
const sqlGuide = (category) => {
  const value = category?.toLowerCase() ?? '';
  if (/join/.test(value)) return 'https://www.postgresql.org/docs/current/tutorial-join.html';
  if (/cte|recursive/.test(value)) return 'https://www.postgresql.org/docs/current/queries-with.html';
  if (/window|ranking|analytics|streak/.test(value)) return 'https://www.postgresql.org/docs/current/tutorial-window.html';
  if (/date/.test(value)) return 'https://www.postgresql.org/docs/current/functions-datetime.html';
  if (/string|pattern/.test(value)) return 'https://www.postgresql.org/docs/current/functions-string.html';
  if (/aggregation|group|having|statistic/.test(value)) return 'https://www.postgresql.org/docs/current/functions-aggregate.html';
  if (/full-text/.test(value)) return 'https://www.postgresql.org/docs/current/textsearch.html';
  if (/ddl|data manipulation/.test(value)) return 'https://www.postgresql.org/docs/current/ddl.html';
  return 'https://www.postgresql.org/docs/current/queries-select.html';
};
const sql = source.sql.map((item) => ({ ...item, id: byTitle.get(item.title.toLowerCase())?.id ?? `sql-ref-${String(item.index).padStart(3, '0')}`, url: sqlGuide(item.category) }));
const system = source.system.map((item) => ({ ...item, id: byTitle.get(item.title.toLowerCase())?.id ?? `sd-ref-${String(item.index).padStart(2, '0')}`, url: item.articleUrl || item.videoUrl }));
const videoQuestions = new Map();
for (const playlist of source.playlists) {
  playlist.videos = playlist.videos.filter((video) => {
    const youtubeId = new URL(video.url).searchParams.get('v');
    return Boolean(youtubeId && /^[A-Za-z0-9_-]{11}$/.test(youtubeId));
  });
  playlist.videos.forEach((video, index) => { video.index = index + 1; });
}
for (const playlist of source.playlists) for (const video of playlist.videos) {
  const youtubeId = new URL(video.url).searchParams.get('v');
  const id = `yt-${createHash('sha256').update(youtubeId).digest('hex').slice(0, 24)}`;
  video.questionId = id;
  if (!videoQuestions.has(id)) videoQuestions.set(id, { id, title: video.title, url: `https://www.youtube.com/watch?v=${youtubeId}` });
}
const sqlRows = sql.map((item) => `(${[item.id, item.title, 'SQL practice', item.url, item.difficulty].map(quote).join(',')},array[${quote('SQL')},${quote(item.category ?? 'Practice')}])`);
const systemRows = system.map((item) => `(${[item.id, item.title, 'System design', item.url].map(quote).join(',')},null,array[${quote('System Design')},${quote(item.level)}])`);
const videoRows = [...videoQuestions.values()].map((item) => `(${[item.id, item.title, 'YouTube', item.url].map(quote).join(',')},null,array[${quote('Video lesson')}])`);
const playlistRows = source.playlists.map((item, index) => `(${[item.slug,item.group,item.title,item.creator,item.sourceUrl,item.thumbnail].map(quote).join(',')},${index})`);
const placementRows = source.playlists.flatMap((item) => item.videos.map((video, index) => `(${quote(item.slug)},${quote(video.questionId)},${index})`));
const migration = `-- Add public SQL prompts, system design prompts, and real YouTube playlist lessons.
-- Titles and destination URLs only; no answer text, video files, or source thumbnails are copied.
-- Existing canonical progress/bookmarks are retained. The old category rows are backed up.
create schema if not exists private;
create table if not exists private.interview_category_questions_before_reference_20261024 as
  select * from public.interview_category_questions where category_slug in ('sql','system-design');
revoke all on private.interview_category_questions_before_reference_20261024 from anon,authenticated;

insert into public.interview_questions(id,title,source,url,difficulty,tags) values
${sqlRows.join(',\n')}
on conflict (id) do nothing;

insert into public.interview_questions(id,title,source,url,difficulty,tags) values
${systemRows.join(',\n')}
on conflict (id) do update set url=excluded.url, tags=excluded.tags, source=excluded.source;

insert into public.interview_questions(id,title,source,url,difficulty,tags) values
${videoRows.join(',\n')}
on conflict (id) do nothing;

delete from public.interview_category_questions where category_slug in ('sql','system-design');
insert into public.interview_category_questions(category_slug,question_id,position) values
${[...sql.map((item) => `('sql',${quote(item.id)},${item.index - 1})`), ...system.map((item) => `('system-design',${quote(item.id)},${item.index - 1})`)].join(',\n')};

create table if not exists public.interview_playlists (
  slug text primary key check (slug ~ '^[a-zA-Z0-9-]{2,100}$'),
  group_slug text not null check (group_slug ~ '^[a-z0-9-]{2,80}$'),
  title text not null,
  creator text not null,
  source_url text not null check (source_url ~ '^https://'),
  thumbnail_url text not null check (thumbnail_url ~ '^https://'),
  position integer not null
);
create table if not exists public.interview_playlist_videos (
  playlist_slug text not null references public.interview_playlists(slug) on delete cascade,
  question_id text not null references public.interview_questions(id) on delete restrict,
  position integer not null check (position >= 0),
  primary key (playlist_slug,position)
);
create index if not exists interview_playlists_group_idx on public.interview_playlists(group_slug,position);
alter table public.interview_playlists enable row level security;
alter table public.interview_playlist_videos enable row level security;
create policy interview_playlists_read on public.interview_playlists for select to anon,authenticated using (true);
create policy interview_playlist_videos_read on public.interview_playlist_videos for select to anon,authenticated using (true);
grant select on public.interview_playlists,public.interview_playlist_videos to anon,authenticated;
insert into public.interview_playlists(slug,group_slug,title,creator,source_url,thumbnail_url,position) values
${playlistRows.join(',\n')}
on conflict (slug) do update set title=excluded.title,creator=excluded.creator,source_url=excluded.source_url,thumbnail_url=excluded.thumbnail_url,position=excluded.position;
insert into public.interview_playlist_videos(playlist_slug,question_id,position) values
${placementRows.join(',\n')}
on conflict (playlist_slug,position) do update set question_id=excluded.question_id;
`;
writeFileSync('supabase/migrations/20261024230000_interview_sql_system_playlists.sql', migration);
writeFileSync('data/interview-reference-collections.json', `${JSON.stringify(source, null, 2)}\n`);
console.log(JSON.stringify({ sql: sql.length, system: system.length, playlists: source.playlists.length, videoRows: placementRows.length, uniqueVideos: videoQuestions.size, reusedSql: sql.filter((item) => !item.id.startsWith('sql-ref-')).length, reusedSystem: system.filter((item) => !item.id.startsWith('sd-ref-')).length }));
