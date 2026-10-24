import { chromium } from 'playwright-core';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
const env=Object.fromEntries(readFileSync('.env.local','utf8').split(/\r?\n/).filter(line=>line&&!line.startsWith('#')).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1).replace(/^['"]|['"]$/g,'')]}));
const admin=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const origin=process.env.INTERVIEW_QA_ORIGIN??'http://localhost:8111';
const email=`interview-progress-qa-${crypto.randomUUID()}@example.invalid`;
const password=`${crypto.randomUUID()}Aa9!`;
let userId;let browser;
try{
  const created=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:'Interview QA'}});
  if(created.error||!created.data.user)throw created.error??new Error('User creation failed');userId=created.data.user.id;
  const profile=await admin.from('profiles').upsert({id:userId,display_name:'Interview QA',onboarding_step:6,onboarding_completed_at:new Date().toISOString()},{onConflict:'id'});
  if(profile.error)throw profile.error;
  const first=await admin.from('interview_technical_questions').select('question_id').eq('sheet_slug','dbms-questions').limit(1).single();
  if(first.error)throw first.error;
  const saved=await admin.from('interview_user_questions').upsert([
    {user_id:userId,question_id:'lc-two-sum',completed:true,bookmarked:true},
    {user_id:userId,question_id:first.data.question_id,completed:true,bookmarked:false},
  ],{onConflict:'user_id,question_id'});
  if(saved.error)throw saved.error;
  browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const login=await page.request.post(`${origin}/api/auth/email`,{data:{action:'login',email,password,next:'/interview-preparations/progress'}});
  if(login.status()!==200)throw new Error(`Login failed: ${login.status()} ${(await login.text()).slice(0,200)}`);
  await page.goto(`${origin}/interview-preparations/progress`);
  await page.locator('.ip-progress-ledger').waitFor({timeout:20000});
  const ledger=await page.locator('.ip-progress-ledger').innerText();
  if(!ledger.includes('2')||!ledger.includes('1')||!await page.getByRole('heading',{name:'Difficulty breakdown'}).isVisible())throw new Error(`Progress dashboard incorrect: ${ledger}`);
  await page.screenshot({path:'artifacts/interview-expanded-qa/progress-authenticated-1440.png'});
  await page.goto(`${origin}/training/symm?topic=Learn%20SQL%20for%20interviews`);
  await page.locator('#symm-topic').waitFor({timeout:20000}).catch(async()=>{throw new Error(`SYMM composer missing at ${page.url()}: ${(await page.locator('body').innerText()).slice(0,500)}`)});
  if(await page.locator('#symm-topic').inputValue()!=='Learn SQL for interviews')throw new Error('SYMM AI did not receive the topic');
  console.log('PASS: authenticated progress statistics, saved questions, and SYMM AI topic handoff.');
}finally{if(browser)await browser.close();if(userId){const removed=await admin.auth.admin.deleteUser(userId);if(removed.error)console.error('QA user cleanup failed:',removed.error.message)}}
