import {readFileSync,writeFileSync} from 'node:fs';
const t=readFileSync('.local-backups/gfg-public-profile.txt','utf8');let decoded='';for(const m of t.matchAll(/self\.__next_f\.push\((\[.*?\])\)<\/script>/gs)){try{const a=JSON.parse(m[1]);if(typeof a[1]==='string')decoded+=a[1]}catch{}}
writeFileSync('.local-backups/gfg-flight.txt',decoded);
for(const term of ['"username":"sandeepjain"','"handle"','"userData"','"profile"','"bio"','"user_name"','"full_name":"Sandeep']) {let p=decoded.indexOf(term);console.log(term,p>=0?decoded.slice(Math.max(0,p-120),p+750):'absent')}
const cc=readFileSync('.local-backups/codechef-public-profile.txt','utf8');const i=cc.indexOf('<label>Username:');console.log('CC username',cc.slice(i,i+500));
