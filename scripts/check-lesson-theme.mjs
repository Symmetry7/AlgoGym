import assert from 'node:assert/strict';
import {launchBrowser} from './cdp.mjs';
const base=process.env.ALGOGYM_TEST_URL||'http://127.0.0.1:8098';
if(!['127.0.0.1','localhost'].includes(new URL(base).hostname))throw new Error('Local checks only');
const b=await launchBrowser();
const fixture=()=>{
  localStorage.setItem('theme','light');
  window.fetch=async(input,init)=>{
    const url=new URL(typeof input==='string'?input:input.url,location.origin);
    if(init?.method&&init.method!=='GET')throw new Error('No writes in fixture check');
    let data={};
    if(url.pathname==='/api/tracker')data={jobs:[],accounts:[],snapshots:[],solves:[]};
    if(url.pathname==='/api/auth/session')data={user:{id:'lesson-fixture',email:'fixture@example.test'}};
    if(url.pathname==='/api/onboarding')data={profile:{id:'lesson-fixture',onboarding_completed_at:'2026-10-21'},accounts:[],memberships:[],collegeRequests:[]};
    if(url.pathname==='/api/symm')data={configured:false,path:{id:'demo',title:'Grid dynamic programming',description:'Learn from a concrete example.',topic:'Grid DP',status:'ready',level:'beginner',preferred_language:'cpp',objectives:['Understand states'],prerequisites:[],estimated_minutes:60},modules:[{id:'m1',position:0,title:'Grid fundamentals',description:'Understand coordinates and states.',estimated_minutes:30,objectives:[]}],lessons:[{id:'l1',module_id:'m1',position:0,title:'Grid states',status:'ready',content:{introduction:'## Understanding a state\n\nA state describes the cell we are solving for.\n\n| Cell | Paths |\n| --- | --- |\n| (0, 0) | 1 |\n\n$dp[i][j] = dp[i-1][j] + dp[i][j-1]$\n\n```cpp\nint paths = 3;\n```',sections:[],questions:['Why can we reuse a state?'],takeaways:['Identify the state.'],commonMistakes:['Check boundaries.']}}],progress:[],recommendations:[],moduleAwards:[],codeVariants:[],conversation:[]};
    return new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
  };
};
try{
  await b.call('Page.addScriptToEvaluateOnNewDocument',{source:`(${fixture.toString()})()`});
  await b.call('Page.navigate',{url:base+'/training/symm/demo'});
  await b.waitFor("document.querySelector('.symm-roadmap-card')");
  await b.evaluate("document.querySelector('.symm-roadmap-card').click()");
  await b.waitFor("document.querySelector('.symm-roadmap-column > div button')");
  await b.evaluate("document.querySelector('.symm-roadmap-column > div button').click()");
  await b.waitFor("document.querySelector('.lesson-rich-text')");
  const colors=await b.evaluate("({background:getComputedStyle(document.querySelector('article')).backgroundColor,text:getComputedStyle(document.querySelector('.lesson-rich-text')).color})");
  const lightness=value=>{const rgb=value.match(/\d+/g).slice(0,3).map(Number).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722};
  const [low,high]=[lightness(colors.background),lightness(colors.text)].sort((a,b)=>a-b);
  assert.ok((high+.05)/(low+.05)>=4.5,JSON.stringify(colors));
  for(const width of [1440,390]){
    await b.call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<500});
    assert.equal(await b.evaluate('document.documentElement.scrollWidth>innerWidth'),false);
    await b.screenshot(`tmp/lesson-light-${width}.png`);
  }
  console.log('PASS: cached lesson navigation, light-mode reading contrast, mobile overflow; fixture only.');
}finally{await b.close()}
