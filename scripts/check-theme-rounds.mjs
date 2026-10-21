import assert from 'node:assert/strict';
import {launchBrowser} from './cdp.mjs';
const base=process.env.ALGOGYM_TEST_URL||'http://127.0.0.1:8097';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw new Error('Local fixture checks only');
const b=await launchBrowser();
const fixture=()=>{
  window.fetch=async(input,init)=>{
    const url=new URL(typeof input==='string'?input:input.url,location.origin);
    if(url.origin!==location.origin || !url.pathname.startsWith('/api/'))return new Response('{}');
    if(init?.method&&init.method!=='GET')throw new Error('No writes allowed in fixture tests');
    let data={};
    if(url.pathname==='/api/auth/session')data={user:{id:'round-fixture',email:'fixture@example.test',user_metadata:{full_name:'Training preview'}}};
    if(url.pathname==='/api/onboarding')data={profile:{id:'round-fixture',onboarding_completed_at:'2026-10-21'},accounts:[],memberships:[],collegeRequests:[]};
    if(url.pathname==='/api/tracker')data={accounts:[{platform:'codeforces',handle:'fixture'}],snapshots:[{provider:'codeforces',last_synced_at:new Date().toISOString()}],jobs:[],historyComplete:true,solvedIds:[],solves:[],ledger:[],overview:{chakra:0,verifiedSolves:0,activeDays:0},activity:[],topics:[],difficulty:[]};
    if(url.searchParams.get('resource')==='problemset.problems')data={result:{problems:Array.from({length:4},(_,i)=>({contestId:100+i,index:'A',name:'Test problem '+(i+1),rating:800,tags:['implementation']})),problemStatistics:[]}};
    if(url.searchParams.get('resource')==='contest.list')data={result:[]};
    return new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
  };
};
try{
  await b.call('Page.addScriptToEvaluateOnNewDocument',{source:`(${fixture.toString()})()`});
  await b.call('Page.navigate',{url:base+'/training'});
  await b.waitFor("document.querySelector('.theme-round-actions button:not(:disabled)')");
  await b.evaluate("document.querySelector('.theme-round-actions button').click()");
  await b.waitFor("document.querySelectorAll('.theme-round-ladder a').length===4");
  assert.equal(await b.evaluate("JSON.parse(localStorage.getItem('algogym:theme-rounds:round-fixture')).rounds.length"),1);
  await b.call('Page.reload');
  await b.waitFor("document.querySelectorAll('.theme-round-ladder a').length===4");
  assert.equal(await b.evaluate("document.querySelectorAll('.theme-round-actions button')[1].disabled"),true);
  for(const width of [1440,390]){
    await b.call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<500});
    await b.evaluate("document.querySelector('.theme-rounds').scrollIntoView({block:'start'})");
    assert.equal(await b.evaluate('document.documentElement.scrollWidth>innerWidth'),false);
    await b.screenshot(`tmp/theme-round-${width}.png`);
  }
  await b.evaluate("const k='algogym:theme-rounds:round-fixture';const book=JSON.parse(localStorage.getItem(k));book.rounds[0].start=Date.now()-7200001;book.rounds[0].end=Date.now()-1;localStorage.setItem(k,JSON.stringify(book));location.reload()");
  await b.waitFor("document.querySelectorAll('.theme-round-actions button')[1] && !document.querySelectorAll('.theme-round-actions button')[1].disabled");
  await b.evaluate("document.querySelectorAll('.theme-round-actions button')[1].click()");
  await b.waitFor("document.querySelector('.theme-round-history')");
  assert.equal(await b.evaluate("JSON.parse(localStorage.getItem('algogym:theme-rounds:round-fixture')).rounds.filter(r=>r.finished).length"),1);
  console.log('PASS: UI fixture round selection, persistence, timer gate, completion, desktop/mobile overflow. No provider or database writes.');
}finally{await b.close()}
