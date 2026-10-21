import type { Problem } from "./types";
import { z } from "zod";
const roundSchema = z.object({
  id: z.string().min(1), level: z.number().int().min(1).max(97), topic: z.string(),
  start: z.number().finite().nonnegative(), end: z.number().finite(),
  problems: z.array(z.object({ id: z.string(), title: z.string(), url: z.string().url().refine(value => { const url = new URL(value); return url.protocol === 'https:' && url.hostname === 'codeforces.com'; }) })).length(4),
  finished: z.number().finite().positive().optional(), accepted: z.array(z.string()).max(4).optional(),
}).refine(r => r.end > r.start && new Set(r.problems.map(p => p.id)).size === 4 && (!r.accepted || r.accepted.every(id => r.problems.some(p => p.id === id))));
const notebookSchema = z.object({ level: z.number().int().min(1).max(97), rounds: z.array(roundSchema).max(500) }).refine(book => book.rounds.filter(r => !r.finished).length <= 1);
export type RoundNotebook = z.infer<typeof notebookSchema>;
export function readRoundNotebook(value: unknown): RoundNotebook {
  const result = notebookSchema.safeParse(value);
  return result.success ? result.data : { level: 1, rounds: [] };
}
// Independent implementation of the published ThemeCP level schedule.
// Attribution: https://codeforces.com/blog/entry/136704
const foundation = [
  [900,800,800,800,800],[950,800,800,800,900],[1000,800,800,900,900],
  [1050,800,900,900,900],[1100,800,900,900,1000],[1125,800,900,1000,1000],
  [1150,800,1000,1000,1000],[1175,800,1000,1000,1100],[1200,800,1000,1100,1100],
  [1250,800,1000,1100,1200],[1300,800,1000,1200,1200],[1350,800,1000,1200,1300],
];
export function themeLevel(input: number) {
  const level = Number.isFinite(input) ? Math.max(1, Math.min(97, Math.floor(input))) : 1;
  if (level <= 12) return { level, performance: foundation[level-1][0], minutes: 120, ratings: foundation[level-1].slice(1) };
  const cycle = Math.floor((level - 13) / 4), offset = (level - 13) % 4;
  const top = 1400 + cycle * 100;
  return { level, performance: 1400 + (level - 13) * 25,
    minutes: Math.min(180, 120 + Math.max(0, Math.floor((level - 53) / 2)) * 5),
    ratings: [top-600,top-400,top-200,top].map((rating,index)=>rating+(index<offset?100:0)) };
}
export function chooseThemeRound(problems: Problem[], solved: Set<string>, level: number, topic: string): Problem[] {
  const pool = [...new Map(problems.filter(p=>p.platform === "codeforces" && !solved.has(p.id) && p.tags.includes(topic)).map(p=>[p.id,p])).values()];
  const chosen: Problem[] = [];
  for (const rating of themeLevel(level).ratings) {
    const matches = pool.filter(p=>p.rating===rating && !chosen.some(c=>c.id===p.id));
    if (!matches.length) return [];
    chosen.push(matches[Math.floor(Math.random()*matches.length)]);
  }
  return chosen;
}
export function roundAccepted(ids: string[], solves: { problemId: string; acceptedAt: string }[], start: number, end: number): string[] {
  return [...new Set(solves.filter(s=>ids.includes(s.problemId) && Date.parse(s.acceptedAt)>=start && Date.parse(s.acceptedAt)<=end).map(s=>s.problemId))];
}
