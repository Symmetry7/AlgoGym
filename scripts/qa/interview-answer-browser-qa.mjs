import { chromium } from 'playwright-core';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env=Object.fromEntries(readFileSync('.env.local','utf8').split(/\r?\n/).filter(line=>line&&!line.startsWith('#')).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1).replace(/^['"]|['"]$/g,'')]}));
const admin=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const origin=process.env.INTERVIEW_QA_ORIGIN??'http://localhost:8113';
const email=`interview-answer-qa-${crypto.randomUUID()}@example.invalid`;
const password=`${crypto.randomUUID()}Aa9!`;
let userId;let browser;
try{
  const created=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:'Interview Answer QA'}});
  if(created.error||!created.data.user)throw created.error??new Error('User creation failed');userId=created.data.user.id;
  const profile=await admin.from('profiles').upsert({id:userId,display_name:'Interview Answer QA',onboarding_step:6,onboarding_completed_at:new Date().toISOString()},{onConflict:'id'});
  if(profile.error)throw profile.error;
  const first=await admin.from('interview_technical_questions').select('question_id').eq('sheet_slug','dbms-questions').order('position').limit(1).single();
  if(first.error)throw first.error;
  browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const login=await page.request.post(`${origin}/api/auth/email`,{data:{action:'login',email,password,next:'/interview-preparations/interview-questions/dbms-questions'}});
  if(login.status()!==200)throw new Error(`Login failed: ${login.status()}`);
  await page.goto(`${origin}/interview-preparations/interview-questions/dbms-questions`);
  await page.locator('.ip-answer-toggle').first().waitFor({timeout:20000});
  await page.locator('.ip-answer-toggle').first().click();
  await page.locator('.ip-answer-detail>p').first().waitFor({timeout:30000});
  await page.waitForFunction(()=>document.querySelector('.ip-answer-detail')?.textContent?.includes('Example:'),null,{timeout:30000}).catch(async()=>{throw new Error(`Answer not shown: ${(await page.locator('.ip-answer-detail').innerText()).slice(0,500)}`)});
  const answer=await page.locator('.ip-answer-detail').innerText();
  if(answer.includes('Reference sheet')||answer.length<120)throw new Error(`Answer panel incomplete: ${answer.slice(0,250)}`);
  await page.screenshot({path:'artifacts/interview-expanded-qa/dbms-original-answer-1280.png'});
  const anonymous=await browser.newPage();
  const cached=await anonymous.request.get(`${origin}/api/interview?mode=technicalAnswer&sheet=dbms-questions&question=${first.data.question_id}`);
  const payload=await cached.json();
  if(cached.status()!==200||!payload.answer?.includes('Example:'))throw new Error('Cached answer is not publicly readable');
  const illegal=await createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??env.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false}}).from('interview_answer_requests').insert({user_id:userId,question_id:first.data.question_id});
  if(!illegal.error)throw new Error('Anonymous generation log write was permitted');
  console.log(JSON.stringify({result:'PASS',question:first.data.question_id,answerPreview:payload.answer.slice(0,220),cachedPublicly:true,anonymousWritesDenied:true}));
}finally{if(browser)await browser.close();if(userId){const removed=await admin.auth.admin.deleteUser(userId);if(removed.error)console.error('QA user cleanup failed:',removed.error.message)}}
