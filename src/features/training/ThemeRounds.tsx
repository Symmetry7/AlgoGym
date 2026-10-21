"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ExternalLink, RefreshCw } from "lucide-react";
import type { Problem } from "@/lib/types";
import type { TrackedSolve } from "@/lib/tracker-types";
import { chooseThemeRound, roundAccepted, themeLevel, readRoundNotebook, type RoundNotebook } from "@/lib/theme-training";
import "./theme-rounds.css";

type Notebook = RoundNotebook;
export function ThemeRounds({ userId, problems, solves, solvedIds, ready, syncing, onSync }: { userId: string; problems: Problem[]; solves: TrackedSolve[]; solvedIds: string[]; ready: boolean; syncing: boolean; onSync: () => void }) {
  const [book,setBook]=useState<Notebook>({level:1,rounds:[]});
  const [loaded,setLoaded]=useState(false);
  const [topic,setTopic]=useState("implementation");
  const [error,setError]=useState("");
  const [now,setNow]=useState(Date.now());
  const key=`algogym:theme-rounds:${userId}`;
  useEffect(()=>{ setLoaded(false); setBook({level:1,rounds:[]}); try { setBook(readRoundNotebook(JSON.parse(localStorage.getItem(key)||"null"))); } catch { /* Invalid local practice history is ignored. */ } setLoaded(true); },[key]);
  useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id)},[]);
  const save=(next:Notebook)=>{try{localStorage.setItem(key,JSON.stringify(next));setBook(next);setError("")}catch{setError("Your browser could not save this round. Free storage or enable local storage before continuing.")}};
  const active=book.rounds.find(r=>!r.finished);
  const target=themeLevel(active?.level??book.level);
  const accepted=active?roundAccepted(active.problems.map(p=>p.id),solves,active.start,Math.min(now,active.end)):[];
  const seconds=active?Math.max(0,Math.ceil((active.end-now)/1000)):target.minutes*60;
  const topics=[...new Set(problems.filter(p=>p.platform==='codeforces').flatMap(p=>p.tags))].filter(t=>t!=='*special').sort();
  const start=()=>{const chosen=chooseThemeRound(problems,new Set(solvedIds),book.level,topic);if(chosen.length!==4){setError("This topic does not have four unsolved problems at these exact ratings. Choose another topic or level.");return;}const time=Date.now();save({...book,rounds:[{id:crypto.randomUUID(),level:book.level,topic,start:time,end:time+target.minutes*60000,problems:chosen},...book.rounds]})};
  const finish=()=>{if(!active || syncing || (seconds>0 && accepted.length!==4))return; const complete={...active,finished:Date.now(),accepted};save({level:themeLevel(active.level+(accepted.length===4?1:-1)).level,rounds:book.rounds.map(r=>r.id===active.id?complete:r)})};
  return <section className="theme-rounds" aria-labelledby="theme-round-title">
    <div className="theme-round-heading"><div><span className="theme-eyebrow">THEMED PRACTICE</span><h2 id="theme-round-title">One topic. Four problems.<br/><span>A little stronger each round.</span></h2><p>Train across a deliberate difficulty ladder, then upsolve what challenged you.</p></div><a href="https://codeforces.com/blog/entry/136704" target="_blank" rel="noreferrer">The ThemeCP method <ExternalLink size={13}/></a></div>
    <div className="theme-round-builder"><div className="theme-round-controls"><label>Training level<input aria-label="Training level" type="number" min={1} max={97} value={book.level} disabled={Boolean(active)||!loaded} onChange={e=>save({...book,level:themeLevel(Number(e.target.value)).level})}/></label><label>Focus topic<select value={active?.topic??topic} disabled={Boolean(active)} onChange={e=>setTopic(e.target.value)}>{[...new Set([topic,...topics])].map(t=><option key={t}>{t}</option>)}</select></label><div className="theme-round-clock"><span>{active?"Time remaining":"Round duration"}</span><strong>{Math.floor(seconds/3600).toString().padStart(2,'0')}:{Math.floor(seconds%3600/60).toString().padStart(2,'0')}:{(seconds%60).toString().padStart(2,'0')}</strong></div></div>
      <div className="theme-round-ladder">{target.ratings.map((rating,index)=>{const p=active?.problems[index];const done=p&&accepted.includes(p.id);return <div key={index} className={done?'is-solved':''}><span className="theme-round-step">{done?<Check size={16}/>:String(index+1).padStart(2,'0')}</span><span className="theme-round-rating">{rating}<small>Codeforces rating</small></span>{p?<a href={p.url} target="_blank" rel="noreferrer">{p.title}<ExternalLink size={13}/></a>:<p>{['Warm up','Build momentum','Find the pattern','Stretch your thinking'][index]}</p>}</div>})}</div>
      <div className="theme-round-actions"><p>{active?`${accepted.length}/4 accepted within this round`:`Level ${target.level} · practice target ${target.performance}`}<small>Local practice progress. This is not an official Codeforces rating.</small></p>{active?<div><button type="button" onClick={onSync} disabled={syncing}><RefreshCw size={14}/>{syncing?'Syncing…':'Refresh solves'}</button><button type="button" onClick={finish} disabled={syncing||!ready||(seconds>0&&accepted.length<4)}>Finish round <ArrowRight size={14}/></button></div>:<button type="button" onClick={start} disabled={!loaded||!ready||!problems.length}>Start themed round <ArrowRight size={15}/></button>}</div>
      {!ready&&<p className="theme-round-notice">Connect Codeforces and finish synchronization before starting, so solved problems can be excluded.</p>}{error&&<p role="alert" className="theme-round-notice">{error}</p>}
    </div>
    <div className="theme-round-footer"><p>Four in time: move up one level. Otherwise: step down and upsolve. Round history is saved in this browser.</p><Link href="/upsolve">Open Upsolve <ArrowRight size={13}/></Link></div>
    {book.rounds.some(r=>r.finished)&&<details className="theme-round-history"><summary>Round history</summary>{book.rounds.filter(r=>r.finished).slice(0,20).map(r=><div key={r.id}><span>Level {r.level} · {r.topic}</span><span>{r.accepted?.length??0}/4 · {new Date(r.start).toLocaleDateString()}</span><div>{r.problems.filter(p=>!r.accepted?.includes(p.id)).map(p=><a key={p.id} href={p.url} target="_blank" rel="noreferrer">Upsolve: {p.title} ↗</a>)}</div></div>)}</details>}
  </section>;
}
