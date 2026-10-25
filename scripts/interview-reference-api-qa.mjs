import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const origin = process.env.INTERVIEW_QA_ORIGIN ?? 'http://127.0.0.1:8080';
const reference = JSON.parse(readFileSync('docs/hynts-public-company-titles.json', 'utf8'));
const directory = await fetch(`${origin}/api/interview?mode=directory`).then((response) => response.json());
assert.equal(directory.companies?.length, 45);
for (const [slug, track] of Object.entries(reference)) {
  const response = await fetch(`${origin}/api/interview?mode=sheet&company=${slug}`);
  assert.equal(response.status, 200, `${slug}: API ${response.status}`);
  const payload = await response.json();
  const questions = payload.questions ?? [];
  assert.equal(questions.length, track.questions.length, `${slug}: count`);
  assert.deepEqual(questions.map((q) => q.title), track.questions.map((q) => q.title), `${slug}: ordered titles`);
  assert.deepEqual(questions.map((q) => q.url), track.questions.map((q) => q.url.replace(/^hhttps:/, 'https:').replace(/^http:/, 'https:')), `${slug}: source links`);
  assert.equal(directory.companies.find((company) => company.slug === slug)?.count, questions.length, `${slug}: directory count`);
}
console.log(`PASS: 45 company API sheets and directory counts match all ${Object.values(reference).reduce((sum, track) => sum + track.questions.length, 0)} public reference rows.`);
