"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ExternalLink, RefreshCw, Pause, Play, Square, Download, Coins } from "lucide-react";
import type { Problem } from "@/lib/types";
import type { TrackedSolve } from "@/lib/tracker-types";
import { chooseThemeRound, roundAccepted, themeLevel, readRoundNotebook, levelForRating, roundSeconds, toggleRoundPause, finishTrainingRound, type RoundNotebook } from "@/lib/theme-training";
import { chakraFor } from "@/lib/training";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import "./theme-rounds.css";

type Props = {userId:string; problems:Problem[]; solves:TrackedSolve[]; solvedIds:string[]; ready:boolean; syncing:boolean; syncFailed:boolean; onSync:()=>Promise<boolean>; coins:number|null; rating:number|null; catalogError?:string|null; onReloadCatalog:()=>void};
const clock=(seconds:number)=>[Math.floor(seconds/3600),Math.floor(seconds%3600/60),seconds%60].map(n=>String(n).padStart(2,'0')).join(':');
export function ThemeRounds({userId,problems,solves,solvedIds,ready,syncing,syncFailed,onSync,coins,rating,catalogError,onReloadCatalog}:Props) {
  const [book,setBook]=useState<RoundNotebook>({level:1,rounds:[]});
  const [levelText,setLevelText]=useState('1');
  const [loaded,setLoaded]=useState(false);
  const [tags,setTags]=useState<string[]>([]);
  const [tagSearch,setTagSearch]=useState('');
  const [tagsOpen,setTagsOpen]=useState(false);
  const [bounds,setBounds]=useState({min:'',max:''});
  const [draft,setDraft]=useState<Problem[]>([]);
  const [showRatings,setShowRatings]=useState(false);
  const [view,setView]=useState<'training'|'statistics'|'upsolve'>('training');
  const [confirm,setConfirm]=useState<string|null>(null);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [now,setNow]=useState(Date.now());
  const [finishing,setFinishing]=useState(false);
  const [finishRequest,setFinishRequest]=useState<{id:string;cutoff:number}|null>(null);
  const autoFinish=useRef('');
  const key=`algogym:theme-rounds:${userId}`;
  useEffect(()=>{
    try {const saved=localStorage.getItem(key);const next=saved?readRoundNotebook(JSON.parse(saved)):{level:levelForRating(rating??0),rounds:[]};setBook(next);setLevelText(String(next.level));}
    catch {setError('Saved training could not be read. Your verified solves and coins are unaffected.');}
    setLoaded(true);
  },[key,rating]);
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer)},[]);
  const save=(next:RoundNotebook)=>{
    try {localStorage.setItem(key,JSON.stringify(next));setBook(next);setLevelText(String(next.level));setError('');return true;}
    catch {setError('Your browser could not save training. Enable local storage or free space, then retry.');return false;}
  };
  const active=book.rounds.find(r=>!r.finished);
  const target=themeLevel(active?.level??book.level);
  const paused=Boolean(active?.pauses.some(p=>p.end===undefined));
  const preparing=Boolean(active&&now<active.start);
  const seconds=active?roundSeconds(active,now):target.minutes*60;
  const accepted=active?roundAccepted(active.problems.map(p=>p.id),solves,active.start,Math.min(now,active.end),active.pauses):[];
  const allTags=[...new Set(problems.filter(p=>p.platform==='codeforces').flatMap(p=>p.tags))].filter(t=>t!=='*special').sort();
  const history=book.rounds.filter(r=>r.finished);
  const remaining=[...new Map(history.flatMap(r=>r.problems.filter(p=>!r.accepted?.includes(p.id))).map(p=>[p.id,p])).values()].filter(p=>!solvedIds.includes(p.id));
  const requestFinish=async()=>{
    if(!active||finishing||syncing)return;
    const requested={id:active.id,cutoff:Date.now()};
    setFinishing(true);setError('');
    try {if(await onSync())setFinishRequest(requested);else {setError('Solve refresh failed. Retry Finish; your session is still saved.');setFinishing(false);}}
    catch {setError('Solve refresh failed. Your round is still saved.');setFinishing(false);}
  };
  useEffect(()=>{
    if(!finishRequest||syncing)return;
    if(syncFailed){setError('Codeforces synchronization failed. This session is still saved; retry Finish after sync succeeds.');setFinishRequest(null);setFinishing(false);return;}
    const next=finishTrainingRound(book,finishRequest.id,solves,finishRequest.cutoff);
    if(save(next)){setNotice(`Session saved. Training level ${next.level}.`);setView('statistics');setDraft([]);}
    setFinishRequest(null);setFinishing(false);
  },[finishRequest,syncing,syncFailed,solves]);
  useEffect(()=>{
    if(!active||!ready||syncing||finishing||paused||preparing||autoFinish.current===active.id)return;
    if(seconds===0||accepted.length===4){autoFinish.current=active.id;void requestFinish();}
  },[active?.id,seconds,accepted.length,ready,syncing,paused,preparing,finishing]);
  const generate=()=>{
    const min=bounds.min?Number(bounds.min):1,max=bounds.max?Number(bounds.max):Infinity;
    if(!Number.isInteger(min)||min<1||(max!==Infinity&&!Number.isInteger(max))||max<min){setError('Enter a valid contest range: oldest round must be at least 1 and no greater than newest round.');setDraft([]);return;}
    const chosen=chooseThemeRound(problems,new Set(solvedIds),book.level,tags,min,max);setDraft(chosen);
    if(chosen.length!==4)setError('Not enough unsolved problems match these ratings and filters. Widen the contest range, remove tags, or change level.');
    else {setError('');setNotice('Four unsolved problems are ready. Start when you are ready.');}
  };
  const start=()=>{
    if(active||draft.length!==4)return;
    if(draft.some(p=>solvedIds.includes(p.id))){setDraft([]);setError('One of these problems is now solved. Generate a fresh set.');return;}
    const time=Date.now()+30_000;
    if(save({...book,rounds:[{id:crypto.randomUUID(),level:book.level,topic:tags.join(', ')||'Any tag',start:time,end:time+target.minutes*60_000,problems:draft.map(({id,title,url})=>({id,title,url})),pauses:[]},...history].slice(0,500)})){setNow(Date.now());setNotice('Get ready: your session starts in 30 seconds.');}
  };
  const exportHistory=()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify({level:book.level,rounds:history},null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='algogym-training-history.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const confirmAction=()=>{
    if(confirm==='finish')void requestFinish();
    else if(confirm==='stop'&&active){save({...book,rounds:history});setDraft([]);setNotice('Session stopped. Your level and history are unchanged.');}
    else if(confirm==='clear')save({...book,rounds:book.rounds.filter(r=>!r.finished)});
    else if(confirm)save({...book,rounds:book.rounds.filter(r=>r.id!==confirm)});
    setConfirm(null);
  };
  const displayed=active?.problems??draft;
  const potential=target.ratings.reduce((total,r)=>total+(chakraFor('codeforces',r)??0),0);
  const earned=active?solves.filter(s=>accepted.includes(s.id)).reduce((total,s)=>total+(s.chakra??0),0):0;
  return <section className="tt-workspace" aria-label="Training Tracker">
    <div className="tt-heading"><div><h2>Training</h2><p>A focused session. Four problems. Measurable progress.</p></div><div className="tt-balance"><Coins size={16}/><strong>{coins===null?'—':coins.toLocaleString()}</strong><span>coins</span></div></div>
    <nav className="tt-tabs" aria-label="Round workspace">{(['training','statistics','upsolve'] as const).map(tab=><button key={tab} onClick={()=>setView(tab)} aria-current={view===tab?'page':undefined}>{tab==='training'?'Training':tab==='statistics'?'Statistics':`Upsolve${remaining.length?` · ${remaining.length}`:''}`}</button>)}</nav>
    {notice&&<p role="status" className="tt-notice">{notice}</p>}{error&&<p role="alert" className="tt-error">{error}</p>}
    {catalogError&&<p role="alert" className="tt-error">{catalogError} <button onClick={onReloadCatalog}>Reload problem catalog</button></p>}
    {view==='training'&&<>
      <div className="tt-stats"><label><span>Level</span><input aria-label="Training level" type="number" min={1} max={109} value={active?.level??levelText} disabled={Boolean(active)||!loaded} onChange={e=>{const value=e.target.value;setLevelText(value);const parsed=Number(value);if(value&&Number.isInteger(parsed)&&parsed>=1&&parsed<=109){save({...book,level:parsed});setDraft([]);}}} onBlur={()=>setLevelText(String(book.level))}/></label><div><span>Target performance</span><strong>{target.performance}</strong></div><div><span>Session time</span><strong>{target.minutes}<small> min</small></strong></div></div>
      {!active&&<div className="tt-panel tt-filters">
        <div className="tt-filter-row"><h3>Tags</h3><div><div className="tt-tag-summary"><span>{tags.join(', ')||'Any tag'}</span><button onClick={()=>setTagsOpen(!tagsOpen)} aria-expanded={tagsOpen}>Choose tags</button>{tags.length>0&&<button onClick={()=>{setTags([]);setDraft([]);}}>Clear tags</button>}</div><p>Choose topics, or leave tags empty to draw from all topics.</p>
          {tagsOpen&&<div className="tt-tag-picker"><input aria-label="Search tags" placeholder="Search topics…" value={tagSearch} onChange={e=>setTagSearch(e.target.value)}/><div>{allTags.filter(t=>t.includes(tagSearch.toLowerCase())).map(tag=><button key={tag} aria-pressed={tags.includes(tag)} onClick={()=>{setTags(tags.includes(tag)?tags.filter(t=>t!==tag):[...tags,tag]);setDraft([]);}}>{tags.includes(tag)&&<Check size={12}/>} {tag}</button>)}</div></div>}
        </div></div>
        <div className="tt-filter-row"><h3>Contest range</h3><div className="tt-bounds"><label>Oldest round<input type="number" min={1} placeholder="1" value={bounds.min} onChange={e=>{setBounds({...bounds,min:e.target.value});setDraft([]);}}/></label><span>to</span><label>Newest round<input type="number" min={1} placeholder="Latest" value={bounds.max} onChange={e=>{setBounds({...bounds,max:e.target.value});setDraft([]);}}/></label></div></div>
      </div>}
      <div className="tt-panel">
        <div className="tt-panel-title"><h3>Problems</h3><button onClick={()=>setShowRatings(!showRatings)}>{showRatings?'Hide':'Show'} ratings</button></div>
        {active&&<div className={`tt-timer ${paused?'is-paused':''}`}><span>{preparing?'Starts in':paused?'Paused':seconds===0?'Time is up':'Time remaining'}</span><strong>{clock(preparing?Math.max(0,Math.ceil((active.start-now)/1000)):seconds)}</strong><span>{accepted.length} / 4 accepted</span></div>}
        <div className="tt-problems">{target.ratings.map((rating,index)=>{const p=displayed[index];const done=p&&accepted.includes(p.id);return <article key={index} className={done?'is-solved':''}><div><span>P{index+1}</span><span>{done?<Check size={16}/>:showRatings?rating:'••••'}</span></div>{p?<a href={p.url} target="_blank" rel="noreferrer">{p.title}<ExternalLink size={13}/></a>:<p>—</p>}{showRatings&&<small>{chakraFor('codeforces',rating)} eligible coins</small>}{done&&<small>Accepted</small>}</article>})}</div>
        <div className="tt-actions">{active?<><button className="tt-secondary" disabled={preparing||seconds===0||finishing} onClick={()=>save({...book,rounds:book.rounds.map(r=>r.id===active.id?toggleRoundPause(r,Date.now()):r)})}>{paused?<Play size={14}/>:<Pause size={14}/>} {paused?'Resume':'Pause'}</button><button className="tt-secondary" disabled={finishing} onClick={()=>setConfirm('stop')}><Square size={13}/> Stop</button><button className="tt-secondary" disabled={syncing||finishing} onClick={()=>void onSync()}><RefreshCw size={14} className={syncing?'animate-spin':''}/>{syncing?'Syncing…':'Refresh solves'}</button><button disabled={preparing||finishing||syncing||!ready} onClick={()=>accepted.length===4?void requestFinish():setConfirm('finish')}>{finishing?'Saving session…':'Finish'}<ArrowRight size={14}/></button></>:<><button className="tt-secondary" onClick={generate} disabled={!loaded||!ready||syncing||!problems.length}>{draft.length?'Regenerate problems':'Generate problems'}</button>{draft.length===4&&<button onClick={start} disabled={!ready||syncing}><Play size={14}/>Start training</button>}</>}</div>
        <div className="tt-reward"><Coins size={14}/><p>{active?`${earned} verified coins from this round`:`Up to ${potential} eligible coins in this set`}<small>Coins are credited by Codeforces sync, once per eligible verified solve. Pause, stop and level changes never mint coins.</small></p></div>
        {active&&<p className="tt-footnote">{paused?'The timer is paused. Solves submitted during a pause do not count toward this timed session.':'Finish saves the session and updates your level. Stop discards it without changing your level.'}</p>}
      </div>
      {!ready&&<p className="tt-notice">Connect Codeforces and complete synchronization to exclude solved problems. <Link href="/onboarding?step=3">Manage connection →</Link></p>}
    </>}
    {view==='statistics'&&<div className="tt-panel"><div className="tt-panel-title"><h3>Training history</h3><div><button onClick={exportHistory} disabled={!history.length}><Download size={14}/> Export JSON</button><button onClick={()=>setConfirm('clear')} disabled={!history.length}>Clear history</button></div></div>{!history.length?<p className="tt-empty">Finish your first session to see your performance and training history.</p>:<><div className="tt-stats"><div><span>Sessions</span><strong>{history.length}</strong></div><div><span>Problems solved in time</span><strong>{history.reduce((sum,r)=>sum+(r.accepted?.length??0),0)}</strong></div><div><span>Best performance</span><strong>{Math.max(...history.map(r=>r.performance??0))||'—'}</strong></div></div><div className="tt-chart" aria-label="Training performance history">{history.slice(0,24).reverse().map(r=><div key={r.id} title={`${new Date(r.start).toLocaleDateString()}: ${r.performance??'No score'}`}><i style={{height:`${Math.max(3,Math.min(100,(r.performance??0)/4500*100))}%`}}/><span>{r.performance??'—'}</span></div>)}</div><div className="tt-table"><table><thead><tr><th>Date</th><th>Level</th><th>Tags</th><th>Solved</th><th>Performance</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{history.map(r=><tr key={r.id}><td>{new Date(r.start).toLocaleDateString()}</td><td>{r.level}</td><td>{r.topic}</td><td>{r.accepted?.length??0}/4</td><td>{r.performance??'—'}</td><td><button onClick={()=>setConfirm(r.id)}>Delete</button></td></tr>)}</tbody></table></div></>}</div>}
    {view==='upsolve'&&<div className="tt-panel"><div className="tt-panel-title"><h3>Unfinished problems</h3><button disabled={syncing} onClick={()=>void onSync()}><RefreshCw size={14}/> Refresh solves</button></div>{remaining.length?<div className="tt-upsolve">{remaining.map(p=><a key={p.id} href={p.url} target="_blank" rel="noreferrer"><span>{p.title}</span><ExternalLink size={14}/></a>)}</div>:<p className="tt-empty">No unfinished training problems. Completed solves disappear here after synchronization.</p>}</div>}
    <footer className="tt-footer"><span>Four solves in time advance your level; otherwise, step down and upsolve.</span><small>History stays in this browser.</small></footer>
    <AlertDialog open={Boolean(confirm)} onOpenChange={open=>{if(!open)setConfirm(null)}}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{confirm==='stop'?'Stop this session?':confirm==='finish'?'Finish this session now?':'Delete training history?'}</AlertDialogTitle><AlertDialogDescription>{confirm==='stop'?'This session will not be added to history. Your level and verified coins stay unchanged.':confirm==='finish'?'We will refresh your solves, save this result, and move your level down by one unless all four problems were accepted in time.':'This removes local practice records only. Verified solves, coins and your current training level stay unchanged. Export your history first if you need a backup.'}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmAction}>{confirm==='stop'?'Stop session':confirm==='finish'?'Finish session':'Delete records'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </section>;
}
