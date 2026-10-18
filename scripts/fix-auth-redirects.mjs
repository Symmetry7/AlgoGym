import {spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
const cli=process.argv[2];if(!cli)throw new Error('Pass the authenticated Supabase CLI path.');
const args=['--project-ref','sfnmcgcxerbqceujzbqv','--workdir','.local-backups/auth-redirect-fix'];
const run=command=>{const result=spawnSync(cli,command,{encoding:'utf8',windowsHide:true});if(result.status!==0)throw new Error('The isolated Auth configuration command failed.');return result;};
const diff=JSON.parse(run(['config','diff',...args]).stdout);const declared=diff.changes.filter(change=>change.declared&&change.class==='update');const allowed=new Set(['auth.site_url','auth.additional_redirect_urls']);if(declared.some(change=>!allowed.has(change.path.join('.')))||declared.length>2)throw new Error('Refusing to change unrelated Auth settings.');
console.log(JSON.stringify({reviewedChanges:declared.map(change=>({setting:change.path.join('.'),before:change.remote,after:change.local}))},null,2));
if(!process.argv.includes('--apply'))process.exit(0);
if(declared.length){writeFileSync('.local-backups/auth-redirect-before.json',JSON.stringify(declared.map(change=>({setting:change.path.join('.'),value:change.remote})),null,2));run(['config','push',...args,'--yes']);}
const after=JSON.parse(run(['config','diff',...args]).stdout);if(after.changes.some(change=>change.declared&&change.class==='update'))throw new Error('Auth URL settings did not match the reviewed correction.');console.log(JSON.stringify({applied:true,remainingDeclaredChanges:0,googleCredentialsUnchanged:true,emailConfirmationUnchanged:true,mfaUnchanged:true}));
