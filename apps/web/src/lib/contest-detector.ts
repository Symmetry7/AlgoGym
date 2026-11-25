/** Classify only actual public contest titles; IDs are not evidence of division. */
export function detectContestTypeFromName(contestName:string):string {
 const name=contestName.toLowerCase();
 if(/\beducational\b|\bedu\b/.test(name))return 'educational';
 if(/\bglobal\b/.test(name))return 'global';
 for(const division of [1,2,3,4])if(new RegExp(`\\b(?:div(?:ision)?\\.?\\s*)${division}\\b`).test(name))return `div${division}`;
 if(/good bye|\bhello\b|april fools?/.test(name))return 'special';
 return 'other';
}
