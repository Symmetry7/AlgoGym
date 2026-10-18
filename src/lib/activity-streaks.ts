export function activityStreaks(activity:Array<{date:string;count:number}>,now=new Date()){
 const days=[...new Set(activity.filter(item=>item.count>0).map(item=>Date.parse(`${item.date.slice(0,10)}T00:00:00Z`)).filter(Number.isFinite))].sort((a,b)=>a-b);let maximum=0;let run=0;let previous=0;
 for(const day of days){run=day-previous===86400000?run+1:1;maximum=Math.max(maximum,run);previous=day;}
 const today=Date.parse(`${now.toISOString().slice(0,10)}T00:00:00Z`);let current=0;const active=new Set(days);let cursor=active.has(today)?today:today-86400000;while(active.has(cursor)){current++;cursor-=86400000;}
 return {current,maximum,activeDays:days.length};
}
