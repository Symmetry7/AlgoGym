import {launchBrowser} from './cdp.mjs';
const browser=await launchBrowser();
try {
  await browser.call('Page.navigate',{url:'http://127.0.0.1:8080/training/symm'});
  await new Promise(resolve=>setTimeout(resolve,4000));
  console.log(JSON.stringify(await browser.evaluate(`({url:location.href,title:document.title,text:document.body.innerText.slice(0,900),width:document.documentElement.scrollWidth,viewport:innerWidth})`)));
  console.log(JSON.stringify(browser.events.filter(event=>event.method==='Runtime.exceptionThrown').map(event=>event.params.exceptionDetails?.text)));
  await browser.screenshot('.local-backups/symm-desktop.png');
} finally {await browser.close();}
