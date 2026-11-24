import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const executablePath = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
if (!executablePath) throw new Error('Chrome or Edge is required.');
const browser = await chromium.launch({headless:true,executablePath});
const origin=process.env.INTERVIEW_QA_ORIGIN??'http://127.0.0.1:8080';
const folder=resolve('artifacts/interview-role-qa');
mkdirSync(folder,{recursive:true});
try {
  for (const width of [375,768,1440]) {
    const page=await browser.newPage({viewport:{width,height:900}});
    const errors=[];
    page.on('pageerror',(error)=>errors.push(error.message));
    await page.goto(`${origin}/interview-preparations/role-wise`,{waitUntil:'domcontentloaded'});
    await page.locator('.ip-role-card').first().waitFor({timeout:20000});
    const marks=await page.locator('.ip-role-card .ip-role-mark svg').count();
    if(marks<20)throw new Error(`Only ${marks} role icons rendered.`);
    await page.locator('.ip-role-card').first().click();
    await page.locator('.ip-answer-item').first().waitFor({timeout:20000});
    if(await page.locator('.ip-role-sheet-heading .ip-role-mark svg').count()!==1)throw new Error('Role icon missing from detail header.');
    const first=page.locator('.ip-answer-item').first();
    const firstQuestion=(await first.locator('.ip-answer-toggle strong').innerText()).trim();
    await first.locator('.ip-answer-toggle').click();
    await first.getByText('AlgoGym answer').waitFor();
    if(await first.locator('.ip-answer-detail').count()!==1)throw new Error('Answer did not expand.');
    const api=await page.evaluate(async()=>{
      const questions=(await(await fetch('/api/interview?mode=roleSheet&role=frontend-developer')).json()).questions;
      const id=questions[0].id;
      const cached=await fetch(`/api/interview?mode=roleAnswer&role=frontend-developer&question=${id}`);
      const invalid=await fetch('/api/interview?mode=roleAnswer&role=frontend-developer&question=invalid-role-question');
      const denied=await fetch('/api/interview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'roleAnswer',roleSlug:'frontend-developer',questionId:id})});
      return {cached:cached.status,invalid:invalid.status,denied:denied.status};
    });
    if(api.cached!==200||api.invalid!==404||![401,403].includes(api.denied))throw new Error(`Role answer API statuses ${JSON.stringify(api)}`);
    const filter=page.getByRole('combobox',{name:'Filter by difficulty'});
    await filter.click();
    const menu=page.getByRole('listbox');
    await menu.waitFor();
    const box=await menu.boundingBox();
    if(!box||box.x<0||box.x+box.width>width+1)throw new Error(`Difficulty menu escapes ${width}px viewport.`);
    await page.screenshot({path:resolve(folder,`role-difficulty-${width}.png`)});
    await page.getByRole('option',{name:'Hard'}).click();
    await page.locator('.ip-answer-item').first().waitFor();
    const difficultyLabels=await page.locator('.ip-answer-item .ip-difficulty').allInnerTexts();
    if(difficultyLabels.some((label)=>label.trim()!=='Hard'))throw new Error('Difficulty filter returned another level.');
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    if(overflow>2||errors.length)throw new Error(`Visual or runtime issue: overflow ${overflow}; ${errors.join('; ')}`);
    console.log(JSON.stringify({width,result:'PASS',roleIcons:marks,question:firstQuestion,answerApi:api,menuBox:box,rows:difficultyLabels.length,overflow}));
    await page.close();
  }
} finally {await browser.close();}
