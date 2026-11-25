import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/).map((line) => {
  const i = line.indexOf('=');
  return i < 0 ? [] : [line.slice(0, i), line.slice(i + 1).replace(/^['"]|['"]$/g, '')];
}).filter((pair) => pair.length === 2));
const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error('Missing Supabase public connection.');
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const collections = JSON.parse(readFileSync('data/interview-reference-collections.json', 'utf8'));
const roles = JSON.parse(readFileSync('data/interview-role-reference.json', 'utf8')).roles;
let checked = 0;
async function read(table, columns, field, value) {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    let query = client.from(table).select(columns).order('position').range(offset, offset + 999);
    if (field) query = query.eq(field, value);
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < 1000) return rows;
  }
}
async function compare(label, placements, expected) {
  const ids = [...new Set(placements.map((item) => item.question_id))];
  const byId = new Map();
  for (let i = 0; i < ids.length; i += 100) {
    const { data, error } = await client.from('interview_questions').select('id,title').in('id', ids.slice(i, i + 100));
    if (error) throw error;
    for (const item of data ?? []) byId.set(item.id, item.title);
  }
  const actual = placements.map((item) => byId.get(item.question_id));
  const normalize = (value) => value?.trim().toLocaleLowerCase();
  if (actual.length !== expected.length || actual.some((title, i) => normalize(title) !== normalize(expected[i]))) {
    const mismatch = actual.findIndex((title, i) => normalize(title) !== normalize(expected[i]));
    throw new Error(`${label}: ${actual.length}/${expected.length} rows, first mismatch ${mismatch}: ${actual[mismatch]} <> ${expected[mismatch]}`);
  }
  checked++;
}
for (const [category, list] of [['sql', collections.sql], ['system-design', collections.system]]) {
  await compare(category, await read('interview_category_questions', 'question_id,position', 'category_slug', category), list.map((item) => item.title));
}
for (const role of roles) {
  await compare(role.slug, await read('interview_role_questions', 'question_id,position', 'role_slug', role.slug), role.questions.map((item) => item.title));
}
for (const playlist of collections.playlists) {
  const rows = await read('interview_playlist_videos', 'question_id,position', 'playlist_slug', playlist.slug);
  const expected = playlist.videos.map((video) => video.questionId);
  if (rows.length !== expected.length || rows.some((row, i) => row.question_id !== expected[i]))
    throw new Error(`${playlist.slug}: playlist placement mismatch`);
  checked++;
}
const denied = await client.from('interview_roles').insert({ slug: 'qa-invalid', title: 'Invalid', group_name: 'QA', source_url: 'https://example.com', question_count: 0, position: 999 });
if (!denied.error) throw new Error('Public write to role catalog was allowed.');
console.log(JSON.stringify({ result: 'PASS', collections: checked, sql: collections.sql.length, system: collections.system.length, roles: roles.length, roleQuestions: roles.reduce((n, role) => n + role.questions.length, 0), playlists: collections.playlists.length, videoRows: collections.playlists.reduce((n, list) => n + list.videos.length, 0), anonymousWritesDenied: true }));
