import { launchBrowser } from './cdp.mjs';

const browser = await launchBrowser();
const checks = [];
function assert(value, label) { if (!value) throw new Error(label); checks.push(label); }
try {
  await browser.call('Emulation.setDeviceMetricsOverride', { width:1440, height:1000, deviceScaleFactor:1, mobile:false });
  await browser.call('Page.navigate', { url:'http://localhost:8080/' });
  await browser.waitFor('document.querySelector(".landing-feature-sections")?.dataset.motion === "ready"',60000);
  assert(await browser.evaluate('document.querySelector("h1").innerText.includes("Your competitive programming workspace")'), 'New hero copy is rendered');
  await browser.evaluate('document.querySelector(".story-connect").scrollIntoView({block:"center"})');
  await browser.waitFor('document.querySelector(".story-connect").classList.contains("is-revealed")');
  assert(await browser.evaluate('getComputedStyle(document.querySelector(".story-connect")).animationName === "landing-card-enter"'), 'Scrolling triggers the card reveal');
  assert(await browser.evaluate('getComputedStyle(document.querySelector(".story-connect")).animationIterationCount === "1"'), 'Card reveal does not loop');
  await browser.evaluate('document.querySelector(".story-growth").scrollIntoView({block:"center"})');
  await browser.waitFor('document.querySelector(".story-growth").classList.contains("is-revealed")');
  assert(await browser.evaluate('getComputedStyle(document.querySelector(".growth-visual span")).animationName === "landing-bars-enter"'), 'Growth bars pop in when the card enters');
  await browser.call('Emulation.setEmulatedMedia', {features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await browser.waitFor('document.querySelector(".landing-feature-sections")?.dataset.motion === "reduced"');
  assert(await browser.evaluate('[...document.querySelectorAll(".story-card,.growth-visual span")].every(e=>getComputedStyle(e).animationName === "none")'), 'Changing reduced-motion preference disables reveals and bar motion');
  await browser.evaluate('document.querySelector(".story-connect").focus()');
  assert(await browser.evaluate('document.activeElement.matches(".story-connect") && getComputedStyle(document.activeElement).opacity === "1"'), 'Keyboard focus remains visible');
  assert(!browser.events.some(e=>e.method === 'Runtime.exceptionThrown'), 'No browser runtime exceptions');
  console.log(JSON.stringify({passed:true,checks},null,2));
} finally { await browser.close(); }
