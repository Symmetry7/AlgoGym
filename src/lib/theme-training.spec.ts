import { describe, expect, it } from "vitest";
import { themeLevel, chooseThemeRound, roundAccepted, readRoundNotebook, roundSeconds, toggleRoundPause, finishTrainingRound, trainingPerformance, levelForRating } from "./theme-training";
import type { Problem } from "./types";
describe("ThemeCP rounds", () => {
  it("rejects malformed local history and unsafe problem links", () => {
    const problems=Array.from({length:4},(_,i)=>({id:String(i),title:"Problem",url:"https://codeforces.com/problemset/problem/1/A"}));
    const round={id:"round",level:1,topic:"dp",start:1000,end:2000,problems};
    expect(readRoundNotebook({level:1,rounds:[round]}).rounds).toHaveLength(1);
    for(const bad of [{...round,accepted:"bad"},{...round,level:null},{...round,end:500},{...round,problems:[...problems.slice(1),{...problems[0],url:"javascript:alert(1)"}]},{...round,problems:[...problems.slice(1),{...problems[0],url:"bad"}]}]) {
      expect(readRoundNotebook({level:1,rounds:[bad]})).toEqual({level:1,rounds:[]});
    }
  });
  it("follows the published level targets", () => {
    expect(themeLevel(1)).toEqual({level:1,performance:900,minutes:120,ratings:[800,800,800,800]});
    expect(themeLevel(49).ratings).toEqual([1700,1900,2100,2300]);
    expect(themeLevel(97)).toEqual({level:97,performance:3500,minutes:180,ratings:[2900,3100,3300,3500]});
    expect(themeLevel(NaN).level).toBe(1);
  });
  it("requires four distinct unsolved exact-rating problems in one topic", () => {
    const row=(id:string):Problem=>({id,title:id,platform:"codeforces",rating:800,tags:["dp"],url:"https://codeforces.com/problemset/problem/1/A"});
    const pool=[row("a"),row("a"),row("b"),row("c"),row("d"),row("e")];
    const selected=chooseThemeRound(pool,new Set(["a"]),1,"dp");
    expect(selected).toHaveLength(4);
    expect(new Set(selected.map(p=>p.id)).size).toBe(4);
    expect(selected.some(p=>p.id==="a")).toBe(false);
    expect(chooseThemeRound(pool,new Set(["a","b"]),1,"dp")).toEqual([]);
    expect(chooseThemeRound(pool,new Set(),1,"graphs")).toEqual([]);
  });
  it("only counts accepted timestamps within the round and ignores duplicate evidence", () => {
    expect(roundAccepted(["a","b","c"],[{problemId:"a",acceptedAt:new Date(999).toISOString()},{problemId:"b",acceptedAt:new Date(1500).toISOString()},{problemId:"b",acceptedAt:new Date(1800).toISOString()},{problemId:"c",acceptedAt:new Date(2001).toISOString()}],1000,2000)).toEqual(["b"]);
  });
  it("matches verified solve catalog IDs and excludes solves submitted during a pause",()=>{
    const solves=[
      {id:'codeforces-123A',problemId:'database-uuid-a',acceptedAt:new Date(1400).toISOString()},
      {id:'codeforces-123B',problemId:'database-uuid-b',acceptedAt:new Date(1600).toISOString()},
    ];
    expect(roundAccepted(['codeforces-123A','codeforces-123B'],solves,1000,2000,[{start:1500,end:1800}])).toEqual(['codeforces-123A']);
  });
  it('pauses a running timer across reloads and resumes from remaining wall time',()=>{
    const base={id:'round',level:1,topic:'Any tag',start:1000,end:121000,problems:Array.from({length:4},(_,i)=>({id:String(i),title:'P',url:'https://codeforces.com/problemset/problem/1/A'})),pauses:[]};
    const paused=toggleRoundPause(base,31000);
    expect(roundSeconds(paused,90000)).toBe(90);
    const resumed=toggleRoundPause(paused,91000);
    expect(roundSeconds(resumed,91000)).toBe(90);
    expect(roundSeconds(resumed,181000)).toBe(0);
  });
  it('supports optional multi-tag and contest range filters without reusing solved problems',()=>{
    const problems=Array.from({length:6},(_,i):Problem=>({id:`cf-${i}`,title:`P${i}`,url:`https://codeforces.com/problemset/problem/${i+1}/A`,platform:'codeforces',contestId:i+1,rating:800,tags:i<4?['dp']:['graphs']}));
    expect(chooseThemeRound(problems,new Set(),1,[],1,4)).toHaveLength(4);
    expect(chooseThemeRound(problems,new Set(['cf-0']),1,['dp'],1,4)).toEqual([]);
    expect(chooseThemeRound(problems,new Set(),1,['graphs'],1,6)).toEqual([]);
    expect(chooseThemeRound(problems,new Set(),1,[],3,6)).toHaveLength(4);
  });
  it('records a finished session once and moves level from verified evidence',()=>{
    const problems=Array.from({length:4},(_,i)=>({id:`cf-${i}`,title:'P',url:'https://codeforces.com/problemset/problem/1/A'}));
    const book=readRoundNotebook({level:8,rounds:[{id:'round',level:8,topic:'dp',start:1000,end:121000,problems}]});
    const solves=problems.map(p=>({id:p.id,problemId:'database-uuid',acceptedAt:new Date(61000).toISOString()}));
    const done=finishTrainingRound(book,'round',solves,62000);
    expect(done.level).toBe(9);
    expect(done.rounds[0].accepted).toHaveLength(4);
    expect(done.rounds[0].performance).toBe(trainingPerformance(book.rounds[0],solves,62000));
    expect(finishTrainingRound(done,'round',solves,63000)).toBe(done);
    expect(levelForRating(4000)).toBe(109);
  });
});
