import nextEnv from '@next/env';
import {createClient} from '@supabase/supabase-js';
import {randomBytes, randomUUID} from 'node:crypto';
nextEnv.loadEnvConfig(process.cwd());
const origin='http://localhost:8080';
const db=createClient(process.env.SUPABASE_URL??process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const checks=[];let fixture;
function check(condition,label){if(!condition)throw new Error(label);checks.push(label);}
async function request(path,options={}){return fetch(`${origin}${path}`,{redirect:'manual',signal:AbortSignal.timeout(30000),...options});}
function sessionCookies(response){return response.headers.getSetCookie().filter(value=>!value.includes('Max-Age=0')).map(value=>value.split(';')[0]).join('; ');}
async function passwordLogin(email,password){return request('/api/auth/email',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({action:'login',email,password})});}
try{
 const email=`algogym-recovery-${randomUUID().slice(0,8)}@example.invalid`;
 const password=randomBytes(24).toString('base64url');
 const {data,error}=await db.auth.admin.generateLink({type:'signup',email,password,options:{data:{full_name:'Recovery acceptance fixture',integration_test:true}}});
 if(data?.user)fixture=data.user;
 check(!error&&Boolean(data.properties?.hashed_token),'Generate a genuine signup challenge without sending email');
 const signupPath=`/api/auth/callback?type=signup&token_hash=${encodeURIComponent(data.properties.hashed_token)}&next=/onboarding`;
 const signup=await request(signupPath);let cookie=sessionCookies(signup);
 check(signup.status===303&&signup.headers.get('location')==='/onboarding'&&Boolean(cookie),'Signup confirmation exchanges a real one-time challenge for server cookies');
 check(signup.headers.getSetCookie().some(value=>value.includes('HttpOnly')),'Confirmation session is HttpOnly');
 const session=await request('/api/auth/session',{headers:{Cookie:cookie}});const sessionData=await session.json();
 check(session.ok&&sessionData.user?.id===fixture.id,'Confirmed identity persists across a subsequent session request');
 const replay=await request(signupPath);
 check(replay.headers.get('location')==='/sign-in?auth_error=1','A consumed confirmation challenge is rejected');
 const recovery=await db.auth.admin.generateLink({type:'recovery',email});
 check(!recovery.error&&Boolean(recovery.data.properties?.hashed_token),'Generate a genuine password recovery challenge without email delivery');
 const recoveryPath=`/api/auth/callback?type=recovery&token_hash=${encodeURIComponent(recovery.data.properties.hashed_token)}`;
 const recovered=await request(recoveryPath);cookie=sessionCookies(recovered);
 check(recovered.status===303&&recovered.headers.get('location')==='/account/reset-password'&&Boolean(cookie),'Recovery callback restores a session and routes to password reset');
 const replacement=randomBytes(24).toString('base64url');
 const changed=await request('/api/auth/email',{method:'POST',headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({action:'update-password',password:replacement})});
 check(changed.ok,'Authenticated recovery session can save a new password');
 check((await passwordLogin(email,password)).status===400,'The replaced password no longer signs in');
 check((await passwordLogin(email,replacement)).ok,'The new password signs in through the real email endpoint');
 const recoveryReplay=await request(recoveryPath);check(recoveryReplay.headers.get('location')==='/sign-in?auth_error=1','A recovery challenge cannot be consumed twice');
 const invalid=await request(`/api/auth/callback?type=recovery&token_hash=${randomBytes(32).toString('hex')}`);
 check(invalid.headers.get('location')==='/sign-in?auth_error=1','An invalid challenge cannot establish a session');
 const rejected=await request('/api/auth/email',{method:'POST',headers:{Cookie:cookie,Origin:'https://untrusted.example','Content-Type':'application/json'},body:JSON.stringify({action:'update-password',password:replacement})});
 check(rejected.status===403,'Cross-origin password changes are rejected');
 const logout=await request('/api/auth/signout',{method:'POST',headers:{Cookie:cookie,Origin:origin}});
 check(logout.ok&&logout.headers.getSetCookie().some(value=>value.includes('Max-Age=0')),'Logout expires the server session cookie');
 console.log(JSON.stringify({passed:true,checks,emailDeliveryTested:false,googleInteractiveTested:false},null,2));
}finally{
 if(fixture){const {error}=await db.auth.admin.deleteUser(fixture.id);if(error)throw new Error('Temporary recovery identity cleanup failed.');console.log(JSON.stringify({temporaryIdentityCleanup:true}));}
}
