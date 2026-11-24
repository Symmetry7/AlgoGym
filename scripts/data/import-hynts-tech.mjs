import { writeFileSync } from 'node:fs';

const root = 'https://hynts.in/preparation/most-asked-questions/';
const groups = {
  'Core Subjects': ['dbms-questions','os-questions','oops-questions','cn-questions'],
  'Web Development': ['javascript-questions','typescript-questions','reactjs-questions','nodejs-questions','nextjs-questions','git-github-questions','spring-boot-questions','angular-questions'],
  'Programming Languages': ['cpp-questions','java-questions','python-questions','rust-questions','go-questions'],
  'Mobile Development': ['react-native-questions','swift-questions','flutter-questions','android-questions'],
  DevOps: ['aws-questions','docker-questions','kuberneties-questions','terraform-questions'],
  Databases: ['postgreSQL-questions','mongodb-questions','redis-questions'],
};
const display = { dbms:'DBMS',os:'Operating Systems',oops:'OOP',cn:'Computer Networks',javascript:'JavaScript',typescript:'TypeScript',reactjs:'React',nodejs:'Node.js',nextjs:'Next.js','git-github':'Git & GitHub','spring-boot':'Spring Boot',angular:'Angular',cpp:'C++',java:'Java',python:'Python',rust:'Rust',go:'Go','react-native':'React Native',swift:'Swift',flutter:'Flutter',android:'Android',aws:'AWS',docker:'Docker',kuberneties:'Kubernetes',terraform:'Terraform',postgreSQL:'PostgreSQL',mongodb:'MongoDB',redis:'Redis' };
const decode = (value) => value.replace(/&#x([0-9a-f]+);/gi,(_,hex)=>String.fromCodePoint(parseInt(hex,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&lt;','<').replaceAll('&gt;','>');
async function load(url) {
  for(let attempt=0;attempt<3;attempt++) {
    try {const response=await fetch(url,{headers:{'User-Agent':'AlgoGym public metadata audit'},signal:AbortSignal.timeout(30000)});if(!response.ok)throw new Error(`${response.status} ${url}`);return response.text();}
    catch(error){if(attempt===2)throw error;await new Promise(resolve=>setTimeout(resolve,(attempt+1)*1500));}
  }
}
const index=await load(root);
const found=new Set([...index.matchAll(/href="\/preparation\/most-asked-questions\/([^"?#/]+)"/g)].map(match=>match[1]));
const planned=Object.values(groups).flat();
if(planned.length!==28||planned.some(slug=>!found.has(slug))) throw new Error(`Reference route inventory changed. Missing: ${planned.filter(slug=>!found.has(slug)).join(', ')}`);
const sheets=[];
for(const [group,slugs] of Object.entries(groups)) for(let offset=0;offset<slugs.length;offset+=3) {
  const batch=await Promise.all(slugs.slice(offset,offset+3).map(async slug=>{
    const sourceUrl=`${root}${slug}/`;const html=await load(sourceUrl);
    const rows=[...html.matchAll(/&quot;index&quot;:\[0,(\d+)\]/g)];
    const questions=rows.map((match,index)=>{
      const segment=html.slice(match.index,rows[index+1]?.index??html.length);
      const title=segment.match(/&quot;(?:title|question)&quot;:\[0,&quot;(.*?)&quot;\],&quot;answer&quot;:/)?.[1];
      const difficulty=segment.match(/&quot;difficulty&quot;:\[0,&quot;(.*?)&quot;\]/)?.[1];
      const category=segment.match(/&quot;category&quot;:\[0,&quot;(.*?)&quot;\]/)?.[1];
      return {position:index+1,title:title?decode(title):'',difficulty:difficulty==='Beginner'?'Easy':difficulty==='Intermediate'?'Medium':difficulty==='Advanced'?'Hard':null,category:category?decode(category):null};
    }).filter(row=>row.title);
    if(questions.length<40||questions.some(row=>row.title.length>240))throw new Error(`${slug}: invalid source rows ${questions.length}`);
    const key=slug.replace(/-questions$/,'');
    return {slug:slug.toLowerCase(),title:display[key]??key,group,sourceUrl,questions};
  }));
  sheets.push(...batch);
  process.stdout.write(`${sheets.length}/28: ${batch.map(item=>`${item.slug} ${item.questions.length}`).join(', ')}\n`);
  await new Promise(resolve=>setTimeout(resolve,350));
}
writeFileSync('data/interview-technical-reference.json',`${JSON.stringify({observedAt:new Date().toISOString().slice(0,10),sheets},null,2)}\n`);
console.log(JSON.stringify({sheets:sheets.length,questions:sheets.reduce((sum,s)=>sum+s.questions.length,0)}));
