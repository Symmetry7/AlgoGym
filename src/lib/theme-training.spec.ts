import { describe, expect, it } from "vitest";
import { themeLevel, chooseThemeRound, roundAccepted, readRoundNotebook } from "./theme-training";
import type { Problem } from "./types";
describe("ThemeCP rounds", () => {
  it("rejects malformed local history and unsafe problem links", () => {
    const problems=Array.from({length:4},(_,i)=>({id:String(i),title:"Problem",url:"https://codeforces.com/problemset/problem/1/A"}));
    const round={id:"round",level:1,topic:"dp",start:1000,end:2000,problems};
    expect(readRoundNotebook({level:1,rounds:[round]}).rounds).toHaveLength(1);
    for(const bad of [{...round,accepted:"bad"},{...round,level:null},{...round,end:500},{...round,problems:[...problems.slice(1),{...problems[0],url:"javascript:alert(1)"}]}]) {
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
});
