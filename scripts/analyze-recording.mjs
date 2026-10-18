import {createServer} from 'node:http';
import {createReadStream,statSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {launchBrowser} from './cdp.mjs';
const path=process.argv[2];if(!path)throw new Error('Pass the local screen recording path.');
const size=statSync(path).size;const output=resolve(process.argv.find(arg=>arg.startsWith('--output='))?.slice('--output='.length)??'.local-backups/video-reference');mkdirSync(output,{recursive:true});
const html='<!doctype html><html><body style="margin:0;background:#111"><video id="video" muted preload="auto" style="display:none" src="/recording.mp4"></video><canvas id="frame"></canvas></body></html>';
const server=createServer((req,res)=>{if(req.url!=='/recording.mp4'){res.writeHead(200,{'Content-Type':'text/html'});res.end(html);return;}const match=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);const start=match?Number(match[1]):0;const end=match?.[2]?Math.min(Number(match[2]),size-1):size-1;if(start>=size){res.writeHead(416,{'Content-Range':`bytes */${size}`});res.end();return;}res.writeHead(match?206:200,{'Content-Type':'video/mp4','Accept-Ranges':'bytes','Content-Length':end-start+1,...(match?{'Content-Range':`bytes ${start}-${end}/${size}`}:{})});createReadStream(path,{start,end}).pipe(res);});
await new Promise(accept=>server.listen(0,'127.0.0.1',accept));const browser=await launchBrowser();
try{
 await browser.call('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`});await browser.waitFor('document.querySelector("video").readyState>=2',60000);
 const metadata=await browser.evaluate('({duration:video.duration,width:video.videoWidth,height:video.videoHeight})');console.log(JSON.stringify({metadata}));writeFileSync(`${output}/metadata.json`,JSON.stringify({source:path,...metadata},null,2));
 if(process.argv.includes('--metadata')){process.exitCode=0;}else{
  const interval=Number(process.argv.find(arg=>arg.startsWith('--interval='))?.split('=')[1]??2);const frames=[];
  for(let time=0;time<metadata.duration;time+=interval){
   const data=await browser.evaluate(`(async()=>{const video=document.querySelector('video');video.currentTime=${Math.min(time+.05,metadata.duration-.05)};await new Promise(resolve=>{if(!video.seeking&&video.readyState>=2)return resolve();video.addEventListener('seeked',resolve,{once:true});});const canvas=document.querySelector('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;canvas.getContext('2d').drawImage(video,0,0);return canvas.toDataURL('image/jpeg',.84).split(',')[1];})()`);
   const file=`frame-${String(time).padStart(5,'0')}.jpg`;writeFileSync(`${output}/${file}`,Buffer.from(data,'base64'));frames.push({time,file});if(frames.length%15===0)console.log(JSON.stringify({reviewedThrough:time,frames:frames.length}));
  }
  writeFileSync(`${output}/frames.json`,JSON.stringify(frames,null,2));
  const sharp=(await import('sharp')).default;
  for(let offset=0;offset<frames.length;offset+=9){const tiles=[];for(const [index,frame] of frames.slice(offset,offset+9).entries()){const tile=await sharp(`${output}/${frame.file}`).resize(640,360,{fit:'contain',background:'#111'}).extend({bottom:25,background:'#111'}).jpeg().toBuffer();tiles.push({input:tile,left:index%3*640,top:Math.floor(index/3)*385});const label=Buffer.from(`<svg width="640" height="25"><text x="10" y="18" font-family="sans-serif" font-size="16" fill="white">${Math.floor(frame.time/60)}:${String(frame.time%60).padStart(2,'0')}</text></svg>`);tiles.push({input:label,left:index%3*640,top:Math.floor(index/3)*385+360});}await sharp({create:{width:1920,height:1155,channels:3,background:'#111'}}).composite(tiles).jpeg({quality:90}).toFile(`${output}/contact-${String(offset/9+1).padStart(2,'0')}.jpg`);}
  console.log(JSON.stringify({complete:true,duration:metadata.duration,frames:frames.length,contactSheets:Math.ceil(frames.length/9),output}));
 }
}finally{await browser.close();await new Promise(accept=>server.close(accept));}
