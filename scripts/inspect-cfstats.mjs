import {writeFileSync} from 'node:fs';
import {launchBrowser} from './cdp.mjs';
const browser=await launchBrowser();const results=[];
try{
 await browser.call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await browser.call('Page.navigate',{url:'https://cfstats.vercel.app/'});await browser.waitFor('document.querySelector("h1") && document.querySelector("input")');
 await browser.click('input');await browser.call('Input.insertText',{text:'tourist'});
 const box=await browser.evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('View dossier'));if(!b)return null;const r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
 if(box){await browser.call('Input.dispatchMouseEvent',{type:'mousePressed',...box,button:'left',clickCount:1});await browser.call('Input.dispatchMouseEvent',{type:'mouseReleased',...box,button:'left',clickCount:1});await new Promise((accept)=>setTimeout(accept,10_000));}
 for(const path of ['/','/submissions','/problems','/rating_change','/analysis']){
  if(path!=='/'){await browser.call('Page.navigate',{url:`https://cfstats.vercel.app${path}`});await browser.waitFor('document.readyState === "complete" && document.querySelector("h1")');await new Promise((accept)=>setTimeout(accept,3000));}
  results.push({path,...await browser.evaluate(`({headings:[...document.querySelectorAll('h1,h2,h3')].map(x=>x.textContent),text:document.body.innerText.slice(0,26000),controls:[...document.querySelectorAll('button,input,select')].map(x=>({tag:x.tagName,type:x.type,label:x.getAttribute('aria-label')||x.textContent||x.placeholder})),links:[...document.querySelectorAll('a')].map(x=>({text:x.textContent,href:x.getAttribute('href')})).filter(x=>x.href?.includes('github'))})`)});
  await browser.screenshot(`.local-backups/cfstats-${path==='/'?'overview':path.slice(1)}.png`);
 }
 writeFileSync('.local-backups/cfstats-feature-audit.json',JSON.stringify(results,null,2));
 console.log(JSON.stringify(results.map(({path,headings,text})=>({path,headings,text:text.slice(0,10000)})),null,2));
}finally{await browser.close();}
