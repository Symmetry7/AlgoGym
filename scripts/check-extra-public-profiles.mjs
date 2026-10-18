import ts from 'typescript';
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const code=ts.transpileModule(readFileSync('supabase/functions/profile-verification/public-profiles.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const file=resolve('.local-backups/public-profiles.mjs');writeFileSync(file,code);const {getExtraPublicProfile}=await import(pathToFileURL(file).href);
for(const [platform,handle] of [['atcoder','tourist'],['codechef','gennady.korotkevich'],['github','octocat'],['geeksforgeeks','sandeepjain']]){const p=await getExtraPublicProfile(platform,handle);if(!p.exists||!p.username||typeof p.challenge!=='string')throw new Error(platform+' failed');console.log(JSON.stringify({platform,canonical:p.username,publicFieldReadable:true}));}
