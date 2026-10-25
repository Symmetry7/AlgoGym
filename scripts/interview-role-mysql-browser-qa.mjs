import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';

const executablePath = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
if (!executablePath) throw new Error('Chrome or Edge is required.');
const browser = await chromium.launch({headless:true,executablePath});
const origin = process.env.INTERVIEW_QA_ORIGIN ?? 'http://127.0.0.1:8080';
try {
  for (const width of [375, 1440]) {
    const page = await browser.newPage({viewport:{width,height:900}});
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${origin}/interview-preparations/role-wise`, {waitUntil:'domcontentloaded'});
    const firstRole = page.locator('a[href^="/interview-preparations/role-wise/"]').first();
    await firstRole.waitFor({timeout:15000}).catch(async (error) => {throw new Error(`${error.message}\n${(await page.locator('body').innerText()).slice(-700)}\n${errors.join('; ')}`)});
    await firstRole.click();
    await page.locator('.ip-table tbody tr').first().waitFor();
    if (await page.getByText('Reference sheet').count()) throw new Error('Role sheet still shows reference link.');
    if (await page.locator('a[href*="hynts.in"]').count()) throw new Error('Role page still links to Hynts.');
    const rolePayload = await page.evaluate(async () => (await (await fetch(`/api/interview?mode=roleSheet&role=${location.pathname.split('/').at(-1)}`)).text()));
    if (rolePayload.includes('hynts.in') || rolePayload.includes('source_url')) throw new Error('Role API exposes reference provenance.');
    if (width === 1440) {
      for (const path of ['?mode=roles', '?mode=technicalDirectory', '?mode=technicalSheet&sheet=dbms-questions', '?mode=category&category=hr-questions', '?mode=category&category=system-design', '?mode=playlists&group=dsa-playlists']) {
        const payload = await page.evaluate(async (route) => (await (await fetch(`/api/interview${route}`)).text()), path);
        if (payload.includes('hynts.in')) throw new Error(`Reference URL remains in ${path}`);
      }
    }
    await page.goto(`${origin}/interview-preparations/sql`, {waitUntil:'domcontentloaded'});
    await page.locator('.ip-answer-toggle').first().click();
    await page.getByText('One MySQL 8 answer').waitFor();
    if (await page.getByText('PostgreSQL', {exact:false}).count()) throw new Error('SQL page still mentions PostgreSQL.');
    const sql = await page.evaluate(async () => (await (await fetch('/api/interview?mode=category&category=sql')).json()).questions);
    const concat = sql.find((question) => question.id === 'sql-ref-021');
    if (!concat?.answerCode?.includes('CONCAT(')) throw new Error('SQL API still has PostgreSQL concatenation.');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (overflow > 2 || errors.length) throw new Error(`Browser issues at ${width}px: overflow=${overflow}, errors=${errors.join('; ')}`);
    console.log(JSON.stringify({width,result:'PASS',roleUrl:rolePayload.length,sqlAnswers:sql.length,overflow}));
    await page.close();
  }
} finally {
  await browser.close();
}
