import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const executablePath = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(existsSync);
if (!executablePath) throw new Error('Chrome or Edge is required.');
const browser = await chromium.launch({ headless: true, executablePath });
const origin = process.env.INTERVIEW_QA_ORIGIN ?? 'http://127.0.0.1:8111';
const root = resolve('artifacts/interview-collections-qa');
mkdirSync(root, { recursive: true });
const sizes = [[375,812],[430,932],[768,1024],[1280,800],[1440,900],[1920,1080]];
const routes = [
  ['sql','sql','.ip-answer-item',110],
  ['system','system-design','.ip-answer-item',32],
  ['hr','hr-questions','.ip-answer-item',100],
  ['patterns','patterns','.ip-pattern-list section',22],
  ['roles','role-wise','.ip-role-card',20],
  ['frontend','role-wise/frontend-developer','.ip-table tbody tr',50],
  ['dsa','dsa-playlists','.ip-playlist-card',1],
  ['dsa-detail','dsa-playlists/love-babbar-dsa-playlist','.ip-lesson',1],
  ['core','core-subjects','.ip-playlist-card',1],
  ['system-playlists','system-design-playlists','.ip-playlist-card',1],
];
const failures = [];
try {
  for (const [width,height] of sizes) {
    const page = await browser.newPage({ viewport: { width,height } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const [name,path,selector,minimum] of routes) {
      process.stdout.write(`VIEW ${name} ${width}\n`);
      const response = await page.goto(`${origin}/interview-preparations/${path}`, { waitUntil: 'domcontentloaded' });
      await page.locator(`${selector},.ip-error`).first().waitFor({ timeout: 30000 }).catch(async (error) => {
        process.stdout.write(`BODY ${name}: ${(await page.locator('body').innerText()).slice(-700)}\n`);
        throw error;
      });
      const preview = page.locator('.ip-playlist-card img,.ip-playlist-head img').first();
      if (await preview.count()) {
        await preview.scrollIntoViewIfNeeded();
        await page.waitForFunction(() => {
          const image = document.querySelector('.ip-playlist-card img,.ip-playlist-head img');
          return image instanceof HTMLImageElement && image.complete;
        }, { timeout: 10000 });
      }
      const result = await page.evaluate((selector) => ({
        title: document.querySelector('h1')?.textContent,
        count: document.querySelectorAll(selector).length,
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        error: document.querySelector('.ip-error')?.textContent,
        images: [...document.querySelectorAll('.ip-playlist-card img,.ip-playlist-head img')].slice(0,1).map((image) => image.complete && image.naturalWidth > 0),
      }), selector);
      await page.screenshot({ path: resolve(root, `${name}-${width}.png`) });
      if (response?.status() !== 200 || result.count < minimum || result.overflow > 2 || result.error || errors.length || result.images.some((image) => !image)) failures.push({ width,name,result,errors });
    }
    if (width === 1440) {
      await page.goto(`${origin}/interview-preparations/system-design`);
      await page.locator('.ip-answer-item').first().waitFor();
      await page.getByRole('button',{name:'HLD',exact:true}).click();
      await page.waitForFunction(() => document.querySelectorAll('.ip-answer-item').length === 22);
      const hld = await page.locator('.ip-answer-item').count();
      await page.getByRole('button',{name:'LLD',exact:true}).click();
      await page.waitForFunction(() => document.querySelectorAll('.ip-answer-item').length === 10);
      const lld = await page.locator('.ip-answer-item').count();
      if (hld !== 22 || lld !== 10) failures.push({ interaction:'system filters',hld,lld });
      await page.goto(`${origin}/interview-preparations/sql`);
      await page.locator('.ip-answer-item').first().waitFor();
      await page.locator('.ip-answer-toggle').first().click();
      if (!await page.locator('.ip-answer-detail code').first().isVisible()) failures.push({interaction:'sql answer'});
      await page.goto(`${origin}/interview-preparations/hr-questions`);
      await page.locator('.ip-answer-item').first().waitFor();
      await page.locator('.ip-answer-toggle').first().click();
      if (!await page.locator('.ip-answer-detail p').first().isVisible()) failures.push({interaction:'hr answer'});
      await page.goto(`${origin}/interview-preparations/system-design`);
      await page.locator('.ip-answer-item').first().waitFor();
      await page.locator('.ip-answer-toggle').first().click();
      if (await page.locator('.ip-answer-resources a').count() !== 2) failures.push({interaction:'system resources'});
      await page.goto(`${origin}/interview-preparations/patterns`);
      await page.locator('.ip-pattern-list section').first().waitFor();
      await page.locator('.ip-pattern-list section > button').first().click();
      if (await page.locator('.ip-pattern-list section').first().locator('.ip-table tbody tr').count() !== 4) failures.push({interaction:'pattern expansion'});
      await page.goto(`${origin}/interview-preparations/role-wise`);
      await page.locator('.ip-role-card').first().waitFor();
      await page.getByRole('searchbox',{name:'Search roles'}).fill('data engineer');
      await page.waitForFunction(() => document.querySelectorAll('.ip-role-card').length === 1);
      const filtered = await page.locator('.ip-role-card').count();
      if (filtered !== 1) failures.push({ interaction:'role search',filtered });
    }
    await page.close();
  }
} finally { await browser.close(); }
if (failures.length) { console.error(JSON.stringify(failures,null,2)); process.exitCode = 1; }
else console.log(`PASS: ${routes.length * sizes.length} browser views, system filters, and role search; screenshots in ${root}`);
