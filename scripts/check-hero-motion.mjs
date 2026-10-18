import {launchBrowser} from './cdp.mjs';
const browser=await launchBrowser();const checks=[];
function assert(value,label){if(!value)throw new Error(label);checks.push(label);}
try{
 await browser.call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await browser.call('Page.navigate',{url:'http://localhost:8080/'});
 await browser.waitFor('document.querySelector(".hero-cubes canvas") && document.querySelector(".hero-cubes").dataset.ready==="true"',60000);
 assert(await browser.evaluate('document.querySelector(".hero-cubes canvas").width>0'),'Blender GLB loads and renders through WebGL');
 const start=await browser.evaluate('Number(document.querySelector(".hero-cubes-canvas").dataset.motionTime)');
 await new Promise(resolve=>setTimeout(resolve,1000));
 assert(await browser.evaluate(`Number(document.querySelector('.hero-cubes-canvas').dataset.motionTime)>${start}`),'Cube motion advances over time');
 await browser.screenshot('.local-backups/hero-motion-desktop.png');
 await browser.click('button[aria-label="Pause hero animation"]');
 const pauseTime=await browser.evaluate('document.querySelector(".hero-cubes-canvas").dataset.motionTime');
 await new Promise(resolve=>setTimeout(resolve,500));
 assert(await browser.evaluate(`document.querySelector('.hero-cubes-canvas').dataset.motionTime===${JSON.stringify(pauseTime)}`),'Pause stops all cube transformations');
 await browser.click('button[aria-label="Play hero animation"]');
 await new Promise(resolve=>setTimeout(resolve,400));
 assert(await browser.evaluate(`Number(document.querySelector('.hero-cubes-canvas').dataset.motionTime)>${Number(pauseTime)}`),'Play resumes the animation');
 assert(await browser.evaluate('document.documentElement.scrollWidth<=innerWidth'),'Desktop hero has no document overflow');
 await browser.call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await new Promise(resolve=>setTimeout(resolve,400));
 assert(await browser.evaluate('document.documentElement.scrollWidth<=innerWidth'),'Mobile hero has no document overflow');
 await browser.screenshot('.local-backups/hero-motion-mobile.png');
 await browser.call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await browser.call('Page.reload');
 await browser.waitFor('document.querySelector(".hero-cubes img")?.complete',60000);
 assert(await browser.evaluate('!document.querySelector(".hero-cubes canvas") && document.querySelector(".hero-cubes img").naturalWidth>0'),'Reduced-motion preference uses the Blender still without WebGL animation');
 await browser.screenshot('.local-backups/hero-reduced-motion-mobile.png');
 const errors=browser.events.filter(event=>event.method==='Runtime.exceptionThrown');
 assert(errors.length===0,'Hero journeys have no browser runtime exceptions');
 console.log(JSON.stringify({passed:true,checks},null,2));
}finally{await browser.close();}
