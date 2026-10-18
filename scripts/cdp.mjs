import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
export async function launchBrowser(){
 const executable=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);if(!executable)throw new Error('Chrome or Edge is required for the browser checks.');
 mkdirSync('.local-backups',{recursive:true});const profile=mkdtempSync(resolve('.local-backups/browser-'));
 const process=spawn(executable,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
 const endpoint=await new Promise((accept,reject)=>{let output='';const timeout=setTimeout(()=>reject(new Error('Browser debugging endpoint did not start.')),20_000);process.stderr.on('data',(data)=>{output+=data;const match=output.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match){clearTimeout(timeout);accept(match[1]);}});process.on('exit',()=>{clearTimeout(timeout);reject(new Error('Browser exited before debugging started.'));});});
 const ws=new WebSocket(endpoint);await new Promise((accept,reject)=>{ws.addEventListener('open',accept,{once:true});ws.addEventListener('error',reject,{once:true});});
 let sequence=0;const pending=new Map();const events=[];
 ws.addEventListener('message',(message)=>{const data=JSON.parse(message.data);if(data.id){const request=pending.get(data.id);if(request){clearTimeout(request.timeout);pending.delete(data.id);data.error?request.reject(new Error(data.error.message)):request.resolve(data.result);}}else events.push(data);});
 const send=(method,params={},sessionId)=>new Promise((accept,reject)=>{const id=++sequence;const timeout=setTimeout(()=>{pending.delete(id);reject(new Error(`CDP timed out: ${method}`));},30_000);pending.set(id,{resolve:accept,reject,timeout});ws.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});
 const {targetId}=await send('Target.createTarget',{url:'about:blank'});const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
 const call=(method,params={})=>send(method,params,sessionId);await call('Page.enable');await call('Runtime.enable');await call('Network.enable');
 const evaluate=async(expression)=>{const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.text);return result.result.value;};
 const waitFor=async(expression,timeout=25_000)=>{const start=Date.now();while(Date.now()-start<timeout){if(await evaluate(`Boolean(${expression})`))return;await new Promise((accept)=>setTimeout(accept,250));}throw new Error(`Browser condition timed out: ${expression.slice(0,120)}`);};
 const click=async(selector)=>{const box=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);if(!box)throw new Error(`Missing element ${selector}`);await call('Input.dispatchMouseEvent',{type:'mousePressed',...box,button:'left',clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',...box,button:'left',clickCount:1});};
 const screenshot=async(path)=>{const {data}=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(path,Buffer.from(data,'base64'));};
 return {call,evaluate,waitFor,click,screenshot,events,close:async()=>{await send('Browser.close').catch(()=>undefined);ws.close();process.kill();}};
}
