import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const executablePath=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
if(!executablePath)throw new Error('Chrome or Edge required');
const browser=await chromium.launch({headless:true,executablePath});
const origin=process.env.INTERVIEW_QA_ORIGIN??'http://localhost:8111';
const root=resolve('artifacts/interview-expanded-qa');mkdirSync(root,{recursive:true});
const routes=[
  ['topics','interview-questions','.ip-technical-card',28],
  ['dbms','interview-questions/dbms-questions','.ip-answer-item',40],
  ['notes','cool-notes','.ip-note-card',26],
  ['note','cool-notes/sql-joins','.ip-note-reader li',3],
  ['resumes','resume-templates','.ip-resume-card',6],
  ['resume','resume-templates/precise','.ip-resume-sheet',1],
  ['emails','cold-email-templates','.ip-template-card',36],
  ['email','cold-email-templates/mern-referral','.ip-template-editor',1],
  ['progress','progress','.ip-page-heading',1],
];
const failures=[];
try{
  for(const [width,height] of [[375,812],[430,932],[768,1024],[1280,800],[1440,900],[1920,1080]]){
    const page=await browser.newPage({viewport:{width,height},acceptDownloads:true});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    for(const [name,path,selector,minimum] of routes){
      const response=await page.goto(`${origin}/interview-preparations/${path}`,{waitUntil:'domcontentloaded'});
      await page.locator(`${selector},.ip-error`).first().waitFor({timeout:30000});
      const observed=await page.evaluate(selector=>({count:document.querySelectorAll(selector).length,overflow:document.documentElement.scrollWidth-window.innerWidth,error:document.querySelector('.ip-error')?.textContent}),selector);
      if(response?.status()!==200||observed.count<minimum||observed.overflow>2||observed.error||errors.length)failures.push({width,name,observed,errors});
      if(width===375||width===1440)await page.screenshot({path:resolve(root,`${name}-${width}.png`)});
    }
    if(width===1440){
      await page.goto(`${origin}/interview-preparations/interview-questions`);await page.locator('.ip-technical-card').first().waitFor();
      await page.getByRole('searchbox',{name:'Search technical topics'}).fill('react');
      if(await page.locator('.ip-technical-card').count()<2)failures.push({interaction:'topic search'});
      await page.goto(`${origin}/interview-preparations/interview-questions/dbms-questions`);await page.locator('.ip-answer-item').first().waitFor();
      await page.locator('.ip-answer-toggle').first().click();
      if(!await page.getByRole('link',{name:/Study with SYMM AI/}).first().isVisible())failures.push({interaction:'technical symm link'});
      await page.goto(`${origin}/interview-preparations/cool-notes/sql-joins`);
      const noteDownload=page.waitForEvent('download');await page.getByRole('button',{name:'Download note'}).click();
      if(!(await noteDownload).suggestedFilename().endsWith('.md'))failures.push({interaction:'note download'});
      await page.goto(`${origin}/interview-preparations/resume-templates/precise`);
      const resumeDownload=page.waitForEvent('download');await page.getByRole('button',{name:/Download editable HTML/}).click();
      if(!(await resumeDownload).suggestedFilename().endsWith('.html'))failures.push({interaction:'resume download'});
      await page.goto(`${origin}/training/symm?topic=Learn%20SQL%20for%20interviews`);
      const composer=page.locator('#symm-topic');
      if(await composer.count()){await composer.waitFor({timeout:10000});if(await composer.inputValue()!=='Learn SQL for interviews')failures.push({interaction:'symm topic handoff'});}else if(!await page.getByText('Welcome to AlgoGym').isVisible())failures.push({interaction:'symm access gate missing',body:(await page.locator('body').innerText()).slice(0,300)});
    }
    await page.close();
  }
}finally{await browser.close()}
if(failures.length){console.error(JSON.stringify(failures,null,2));process.exitCode=1}else console.log(`PASS: ${routes.length*6} responsive views, technical search, SYMM handoff, and note/resume downloads. Screenshots: ${root}`);
