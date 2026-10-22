import type { Problem } from "./types";
import { z } from "zod";
const roundSchema = z.object({
  id: z.string().min(1), level: z.number().int().min(1).max(109), topic: z.string(),
  start: z.number().finite().nonnegative(), end: z.number().finite(),
  problems: z.array(z.object({ id: z.string(), title: z.string(), url: z.string().url().refine(value => { try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === 'codeforces.com'; } catch { return false; } }) })).length(4),
  finished: z.number().finite().positive().optional(), accepted: z.array(z.string()).max(4).optional(),
  pauses: z.array(z.object({start:z.number().finite(),end:z.number().finite().optional()})).default([]),
  performance: z.number().finite().optional(),
}).refine(r => r.end > r.start && new Set(r.problems.map(p => p.id)).size === 4 && (!r.accepted || r.accepted.every(id => r.problems.some(p => p.id === id))));
const notebookSchema = z.object({ level: z.number().int().min(1).max(109), rounds: z.array(roundSchema).max(500) }).refine(book => book.rounds.filter(r => !r.finished).length <= 1);
export type RoundNotebook = z.infer<typeof notebookSchema>;
export type TrainingRound = RoundNotebook['rounds'][number];
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
  const level = Number.isFinite(input) ? Math.max(1, Math.min(109, Math.floor(input))) : 1;
  if (level <= 12) return { level, performance: foundation[level-1][0], minutes: 120, ratings: foundation[level-1].slice(1) };
  const advanced = [
    [3550,3000,3100,3300,3500],[3600,3100,3100,3300,3500],[3650,3100,3200,3300,3500],
    [3700,3200,3200,3300,3500],[3725,3200,3300,3300,3500],[3750,3300,3300,3300,3500],
    [3775,3300,3300,3400,3500],[3800,3300,3400,3400,3500],[3850,3400,3400,3400,3500],
    [3900,3400,3400,3500,3500],[3950,3400,3500,3500,3500],[4000,3500,3500,3500,3500],
  ];
  if (level > 97) return {level,performance:advanced[level-98][0],minutes:180,ratings:advanced[level-98].slice(1)};
  const cycle = Math.floor((level - 13) / 4), offset = (level - 13) % 4;
  const top = 1400 + cycle * 100;
  return { level, performance: 1400 + (level - 13) * 25,
    minutes: Math.min(180, 120 + Math.max(0, Math.floor((level - 53) / 2)) * 5),
    ratings: [top-600,top-400,top-200,top].map((rating,index)=>rating+(index<offset?100:0)) };
}
export function chooseThemeRound(problems: Problem[], solved: Set<string>, level: number, topic: string | string[], minContest=1, maxContest=Infinity): Problem[] {
  const tags = typeof topic === 'string' ? (topic ? [topic] : []) : topic;
  const pool = [...new Map(problems.filter(p=>{
    const contest = Number(p.contestId ?? /\/problem\/(\d+)\//.exec(p.url)?.[1]);
    return p.platform === "codeforces" && !solved.has(p.id) && (!tags.length || tags.some(tag=>p.tags.includes(tag))) && contest >= minContest && contest <= maxContest;
  }).map(p=>[p.id,p])).values()];
  const chosen: Problem[] = [];
  for (const rating of themeLevel(level).ratings) {
    const matches = pool.filter(p=>p.rating===rating && !chosen.some(c=>c.id===p.id));
    if (!matches.length) return [];
    chosen.push(matches[Math.floor(Math.random()*matches.length)]);
  }
  return chosen;
}
export function roundAccepted(ids: string[], solves: { id?:string; problemId: string; acceptedAt: string }[], start: number, end: number, pauses:TrainingRound['pauses']=[]): string[] {
  return [...new Set(solves.filter(s=>ids.includes(s.id ?? s.problemId) && Date.parse(s.acceptedAt)>=start && Date.parse(s.acceptedAt)<=end && !pauses.some(p=>Date.parse(s.acceptedAt)>=p.start && Date.parse(s.acceptedAt)<(p.end??Infinity))).map(s=>s.id??s.problemId))];
}

export function levelForRating(rating:number) {
  let level=1;
  for(let next=1;next<=109;next++) if(themeLevel(next).performance<=rating) level=next;
  return level;
}
export function roundSeconds(round:TrainingRound,now:number) {
  const paused=round.pauses.find(p=>p.end===undefined);
  return Math.max(0,Math.ceil((round.end-(paused?.start??now))/1000));
}
export function toggleRoundPause(round:TrainingRound,now:number):TrainingRound {
  if(round.finished || now<round.start) return round;
  const open=round.pauses.find(p=>p.end===undefined);
  if(open) return {...round,end:round.end+Math.max(0,now-open.start),pauses:round.pauses.map(p=>p===open?{...p,end:now}:p)};
  if(now>=round.end)return round;
  return {...round,pauses:[...round.pauses,{start:now}]};
}
export function trainingPerformance(round:TrainingRound,solves:{id?:string;problemId:string;acceptedAt:string}[],cutoff:number) {
  const accepted=roundAccepted(round.problems.map(p=>p.id),solves,round.start,Math.min(round.end,cutoff),round.pauses);
  const index=round.problems.reduce((last,p,i)=>accepted.includes(p.id)?i:last,-1);
  const ratings=themeLevel(round.level).ratings;
  if(index<0)return ratings[0]-50;
  const times=solves.filter(s=>(s.id??s.problemId)===round.problems[index].id).map(s=>Date.parse(s.acceptedAt)).filter(t=>t>=round.start && t<=Math.min(round.end,cutoff) && !round.pauses.some(p=>t>=p.start&&t<(p.end??Infinity)));
  const time=Math.min(...times);
  const paused=round.pauses.reduce((sum,p)=>sum+Math.max(0,Math.min(p.end??time,time)-Math.min(p.start,time)),0);
  const minutes=Math.max(0,(time-round.start-paused)/60000);
  const threshold=Math.max(index===3?120:135,Math.min(index===3?180:195,(index===3?120:135)+2.5*(round.level-52)));
  const next=index===3?ratings[3]+400:ratings[index+1];
  return Math.round(next+(ratings[index]-next)*minutes/threshold+(index===3?((round.level-1)%4)*12.5:0));
}
export function finishTrainingRound(book:RoundNotebook,id:string,solves:{id?:string;problemId:string;acceptedAt:string}[],now:number):RoundNotebook {
  const round=book.rounds.find(r=>r.id===id);
  if(!round || round.finished)return book;
  const accepted=roundAccepted(round.problems.map(p=>p.id),solves,round.start,Math.min(now,round.end),round.pauses);
  return {level:themeLevel(round.level+(accepted.length===4?1:-1)).level,rounds:book.rounds.map(r=>r.id===id?{...r,finished:now,accepted,performance:trainingPerformance(round,solves,now)}:r)};
}
