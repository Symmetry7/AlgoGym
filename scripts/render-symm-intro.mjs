// Reproducible, silent motion graphics from the actual local product preview.
// No AI provider calls or writes to application data.
import { mkdirSync, writeFileSync } from 'node:fs';
import { launchBrowser } from './cdp.mjs';
import { WebmFile } from '@fix-webm-duration/parser';
import { fixParsedWebmDuration } from '@fix-webm-duration/fix';
const base=process.env.ALGOGYM_TEST_URL || 'http://127.0.0.1:8097';
if(!['127.0.0.1','localhost'].includes(new URL(base).hostname))throw new Error('Local captures only');
const browser=await launchBrowser();
mkdirSync('public/media',{recursive:true});
try {
  await browser.call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await browser.call('Page.navigate',{url:base});
  await browser.waitFor("document.querySelector('.symm-preview-generate')");
  await browser.evaluate("document.querySelector('.symm-preview').scrollIntoView({block:'center'})");
  const capture=async()=>{
    const clip=await browser.evaluate("(()=>{const r=document.querySelector('.symm-preview').getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1}})()");
    return (await browser.call('Page.captureScreenshot',{format:'png',clip,captureBeyondViewport:true})).data;
  };
  const prompt=await capture();
  await browser.evaluate("document.querySelector('.symm-preview-generate').click()");
  await browser.waitFor("document.querySelector('.symm-preview-roadmap')");
  const roadmap=await capture();
  await browser.evaluate("document.querySelectorAll('.symm-preview-grid ol button')[3].click()");
  const lesson=await capture();
  await browser.call('Page.navigate',{url:'about:blank'});
  await browser.evaluate(`window.framesData=${JSON.stringify([prompt,roadmap,lesson])}`);
  await browser.evaluate(`(async()=>{
    const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;document.body.append(canvas);
    const ctx=canvas.getContext('2d');
    const images=await Promise.all(window.framesData.map(src=>new Promise(resolve=>{const i=new Image();i.onload=()=>resolve(i);i.src='data:image/png;base64,'+src})));
    const scenes=[
      ['Learning algorithms','shouldn’t feel like guesswork.','From scattered resources to a clear direction.'],
      ['Meet Symm AI.','A question becomes a journey.','Understand the logic. Master the patterns.'],
      ['Start with your question.','Choose the way you learn.','C++17 · Java 17 · Python 3'],
      ['See the whole path.','One concept at a time.','Prerequisites → modules → lessons → practice'],
      ['Understand why it works.','Then understand the code.','Reasoning · worked examples · Socratic questions'],
      ['Turn understanding','into deliberate practice.','Take the next problem with a clearer mental model.'],
      ['Learn competitive programming','from first principles.','Symm AI / AlgoGym']
    ];
    function text(value,x,y,size,color='#f8f7fc',weight=500){ctx.font=weight+' '+size+'px Arial';ctx.fillStyle=color;ctx.fillText(value,x,y)}
    function draw(time){
      const index=Math.min(6,Math.floor(time/6)), local=time%6, scene=scenes[index];
      ctx.globalAlpha=1;ctx.fillStyle='#101115';ctx.fillRect(0,0,1280,720);
      ctx.strokeStyle='#303038';ctx.beginPath();ctx.moveTo(64,94);ctx.lineTo(1216,94);ctx.stroke();
      text('SYMM AI',64,61,20,'#c6b4ed',700);text('PRODUCT DEMONSTRATION',1000,61,12,'#a8a5b0');
      const opacity=Math.min(1,local/.55,(6-local)/.4);ctx.globalAlpha=Math.max(0,opacity);
      const offset=18*(1-Math.min(1,local/.65));
      if(index>=2&&index<=4){
        text(scene[0],64,146+offset,30);text(scene[1],64,186+offset,30,'#c6b4ed');text(scene[2],64,221+offset,17,'#aaa8ba');
        const image=images[index-2], scale=Math.min(1152/image.width,420/image.height)*(1+Math.min(local/6,1)*.018);
        const w=image.width*scale,h=image.height*scale;ctx.drawImage(image,(1280-w)/2,249,w,h);
        text('Illustrative sample in the real AlgoGym interface',64,684,13,'#aaa8ba');
      }else{
        text(scene[0],64,306+offset,index===6?48:58);text(scene[1],64,378+offset,index===6?48:58,'#c6b4ed');text(scene[2],68,447+offset,22,'#aaa8ba');
        if(index===1){ctx.save();ctx.translate(1120,330);ctx.rotate(Math.min(local,2)*.3);for(let i=0;i<6;i++){ctx.rotate(Math.PI/3);ctx.strokeStyle='#c6b4ed';ctx.lineWidth=9;ctx.beginPath();ctx.arc(0,-27,35,0,Math.PI*1.45);ctx.stroke()}ctx.restore()}
      }
      ctx.globalAlpha=1;ctx.fillStyle='#c6b4ed';ctx.fillRect(64,704,1152*Math.min(time/42,1),2);
    }
    draw(40);window.poster=canvas.toDataURL('image/webp',.9).split(',')[1];
    const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm;codecs=vp8';
    const stream=canvas.captureStream(30),recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:2500000}),chunks=[];
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
    recorder.onstop=()=>{const reader=new FileReader();reader.onload=()=>{window.result=reader.result.split(',')[1];window.finished=true;stream.getTracks().forEach(t=>t.stop())};reader.readAsDataURL(new Blob(chunks,{type:mime}))};
    recorder.start(1000);const start=performance.now();
    function frame(){const t=(performance.now()-start)/1000;draw(Math.min(t,41.999));if(t<42)requestAnimationFrame(frame);else recorder.stop()}frame();
  })()`);
  writeFileSync('public/media/symm-intro-poster.webp',Buffer.from(await browser.evaluate('window.poster'),'base64'));
  await browser.waitFor('window.finished',55000);
  const file=new WebmFile(new Uint8Array(Buffer.from(await browser.evaluate('window.result'),'base64')));
  if(!fixParsedWebmDuration(file,42000,{logger:false}))throw new Error('Video duration metadata could not be written');
  writeFileSync('public/media/symm-intro.webm',Buffer.from(await file.toBlob().arrayBuffer()));
  console.log('Created 42-second silent product intro and poster from local interface captures.');
} finally {await browser.close()}
