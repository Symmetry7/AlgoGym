import {launchBrowser} from './cdp.mjs';
const browser = await launchBrowser();
try {
  await browser.call('Page.navigate', {url: 'http://localhost:8080/'});
  await new Promise(resolve => setTimeout(resolve, 8000));
  console.log(JSON.stringify(await browser.evaluate(`({title:document.title,text:document.body.innerText.slice(0,1800),images:[...document.images].map(i=>({src:i.currentSrc,complete:i.complete,width:i.naturalWidth}))})`)));
  await browser.screenshot('.local-backups/localhost-diagnosis.png');
  console.log(JSON.stringify(browser.events.filter(event=>event.method==='Runtime.exceptionThrown').map(event=>event.params.exceptionDetails)));
} finally {await browser.close();}
