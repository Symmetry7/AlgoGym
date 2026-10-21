import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import {launchBrowser} from '../scripts/cdp.mjs';
const base = process.env.ALGOGYM_TEST_URL || 'http://127.0.0.1:8095';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('UI fixture checks are local-only');
const b=await launchBrowser();
mkdirSync('tmp', { recursive: true });
const fixture=()=>{
 const real=window.fetch.bind(window);
 window.fetch=async(input,init)=>{
  const url=new URL(typeof input==='string'?input:input.url,location.origin);
  if(url.origin!==location.origin || !url.pathname.startsWith('/api/'))return real(input,init);
  if(init?.method && init.method!=='GET')throw new Error('Mutations blocked in UI fixture test');
  let data={};
  if(url.pathname==='/api/auth/session')data={user:{id:'ui-fixture',email:'fixture@example.test',user_metadata:{full_name:'UI Test'}}};
  else if(url.pathname==='/api/onboarding')data={profile:{id:'ui-fixture',onboarding_completed_at:'2026-10-21'},accounts:[],memberships:[],collegeRequests:[]};
  else if(url.pathname==='/api/symm')data={configured:false,paths:[{id:'ui-course',title:'Grid DP � UI fixture',topic:'Grid DP',updated_at:'2026-10-21',created_at:'2026-10-21',level:'beginner',status:'ready',preferred_language:'cpp',moduleCount:5,lessonCount:20,completedCount:2}]};
  else if(url.pathname==='/api/tracker')data={jobs:[],accounts:[],snapshots:[],solves:[]};
  return new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
 };
};
try{
 await b.call('Page.addScriptToEvaluateOnNewDocument',{source:`(${fixture.toString()})()`});
 await b.call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await b.call('Page.navigate',{url:base+'/training/symm'});
 await b.waitFor("document.querySelector('.symm-nav-recent a')");
 assert.equal(await b.evaluate('document.documentElement.scrollWidth>innerWidth'),false);
 await b.click('.symm-nav-collapse');
 await b.waitFor("document.querySelector('.symm-product-sidebar.is-collapsed')");
 await b.call('Page.reload');
 await b.waitFor("document.querySelector('.symm-product-sidebar.is-collapsed')");
 await b.click('.symm-nav-collapse');
 await b.screenshot('tmp/symm-sidebar-desktop.png');
 await b.click('.symm-nav-links a[href="/training/symm/library?search=1"]');
 await b.waitFor("document.querySelector('#symm-search')");
 assert.equal(await b.evaluate("document.activeElement.id"),'symm-search');
 await b.call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await b.click('.symm-nav-mobile-trigger');
 await b.waitFor("document.querySelector('[role=dialog]') && Math.abs(document.querySelector('[role=dialog]').getBoundingClientRect().x) < 1");
 await b.screenshot('tmp/symm-sidebar-mobile.png');
 assert.equal(await b.evaluate('document.documentElement.scrollWidth>innerWidth'),false);
 console.log('PASS: fixture UI only � recent path links, persisted collapse, search focus, mobile drawer, no overflow');
}finally{await b.close()}
