import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {launchBrowser} from './cdp.mjs';
const base=process.env.ALGOGYM_TEST_URL || 'http://127.0.0.1:8097';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw new Error('Local checks only');
const b=await launchBrowser();mkdirSync('tmp',{recursive:true});
try {
  await b.call('Page.navigate',{url:base+'/pricing'});
  await b.waitFor("document.querySelector('.pricing-period button')");
  for(const theme of ['light','dark']){
    await b.evaluate(`localStorage.setItem('theme','${theme}');location.reload()`);
    await b.waitFor(`document.documentElement.classList.contains('${theme}') && document.querySelector('.pricing-card')`);
    for(const width of [1440,390]){
      await b.call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<500});
      assert.equal(await b.evaluate('document.documentElement.scrollWidth>innerWidth'),false);
      await b.screenshot(`tmp/release-pricing-${theme}-${width}.png`);
    }
  }
  await b.evaluate("document.querySelectorAll('.pricing-period button')[1].click()");
  await b.waitFor("document.querySelectorAll('.pricing-price')[1].textContent.includes('1,999')");
  assert.equal(await b.evaluate("document.querySelectorAll('.pricing-cta:disabled').length"),2);
  await b.call('Page.navigate',{url:base});
  await b.waitFor("document.querySelector('.symm-film video')");
  assert.equal(await b.evaluate("document.querySelector('video').preload"),'none');
  assert.equal(await b.evaluate("document.querySelector('.symm-film video').autoplay"),false);
  await b.evaluate("document.querySelector('.symm-film video').load()");
  await b.waitFor("document.querySelector('.symm-film video').readyState>=2");
  assert.equal(await b.evaluate("document.querySelector('.symm-film video').duration"),42);
  await b.evaluate("document.querySelector('.symm-film video').muted=true;document.querySelector('.symm-film video').play()");
  await b.waitFor("document.querySelector('.symm-film video').currentTime>1");
  await b.evaluate("document.querySelector('.symm-film video').pause();document.querySelector('.symm-film video').currentTime=25");
  await b.waitFor("!document.querySelector('.symm-film video').seeking");
  for(const width of [1440,390]){
    await b.call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<500});
    await b.evaluate("document.querySelector('.symm-film').scrollIntoView({block:'center'})");
    assert.equal(await b.evaluate('document.documentElement.scrollWidth>innerWidth'),false);
    await b.screenshot(`tmp/release-film-${width}.png`);
  }
  console.log('PASS: pricing themes/mobile/annual toggle; unavailable checkout; video play and seek; landing mobile overflow.');
}finally{await b.close()}
