import {launchBrowser} from './cdp.mjs';
const browser=await launchBrowser();const results=[];
try{
 for(const [width,height,name] of [[1440,1000,'desktop'],[390,844,'mobile']]){
  await browser.call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
  await browser.call('Page.navigate',{url:'http://localhost:8080/'});await browser.waitFor('document.querySelector(".landing-hero h1") && [...document.images].filter(image=>image.getBoundingClientRect().top<innerHeight).every(image=>image.complete && image.naturalWidth>0)');
  await new Promise(resolve=>setTimeout(resolve,1000));
  const state=await browser.evaluate(`({title:document.querySelector('h1').innerText,viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,logos:[...document.querySelectorAll('img[alt="AlgoGym"]')].map(image=>({loaded:image.naturalWidth>0,width:image.parentElement.getBoundingClientRect().width,height:image.parentElement.getBoundingClientRect().height})),links:[...document.querySelectorAll('nav a')].map(a=>a.getAttribute('href')),buttons:[...document.querySelectorAll('button')].filter(b=>b.textContent.includes('Google')).length})`);
  if(state.scrollWidth>width||state.logos.some(logo=>!logo.loaded)||state.buttons!==2)throw new Error(`Landing check failed: ${JSON.stringify(state)}`);
  await browser.screenshot(`.local-backups/landing-${name}.png`);results.push({name,...state});
 }
 await browser.call('Page.navigate',{url:'http://localhost:8080/sign-in'});await browser.waitFor('document.querySelector("[role=dialog]")');
 results.push({signInDialog:await browser.evaluate(`document.querySelector('[role=dialog]').innerText.includes('Continue with Google')`)});
 const errors=browser.events.filter(event=>event.method==='Runtime.exceptionThrown').map(event=>event.params.exceptionDetails.text);if(errors.length)throw new Error(`Browser runtime exceptions: ${errors.join(', ')}`);
 console.log(JSON.stringify({passed:true,results,runtimeErrors:errors},null,2));
}finally{await browser.close();}
